#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, token};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum State {
    Pending = 0,
    Submitted = 1,
    Released = 2,
}

#[contract]
pub struct FeeCollector;

#[contractimpl]
impl FeeCollector {
    pub fn track_fee(e: Env, amount: i128) {
        let key = Symbol::new(&e, "TOTAL_FEES");
        let mut total: i128 = e.storage().instance().get(&key).unwrap_or(0);
        total += amount;
        e.storage().instance().set(&key, &total);
    }
}

#[contract]
pub struct MicroEscrow;

#[contractimpl]
impl MicroEscrow {
    pub fn initialize(e: Env, client: Address, freelancer: Address, fee_collector: Address, token: Address, amount: i128) {
        let state_key = Symbol::new(&e, "STATE");
        if e.storage().instance().has(&state_key) {
            panic!("Already initialized");
        }
        
        client.require_auth();

        let token_client = token::Client::new(&e, &token);
        token_client.transfer(&client, &e.current_contract_address(), &amount);

        e.storage().instance().set(&Symbol::new(&e, "CLIENT"), &client);
        e.storage().instance().set(&Symbol::new(&e, "FREELANCER"), &freelancer);
        e.storage().instance().set(&Symbol::new(&e, "FEE_COLLECTOR"), &fee_collector);
        e.storage().instance().set(&Symbol::new(&e, "TOKEN"), &token);
        e.storage().instance().set(&Symbol::new(&e, "AMOUNT"), &amount);
        e.storage().instance().set(&state_key, &State::Pending);

        // Emit Event: FundsLocked
        e.events().publish(
            (Symbol::new(&e, "MicroEscrow"), Symbol::new(&e, "FundsLocked")),
            (client.clone(), freelancer.clone(), amount)
        );
    }

    pub fn submit_work_link(e: Env, freelancer: Address) {
        let freelancer_key = Symbol::new(&e, "FREELANCER");
        let freelancer_stored: Address = e.storage().instance().get(&freelancer_key).unwrap();
        
        if freelancer != freelancer_stored {
            panic!("Not the authorized freelancer");
        }
        freelancer.require_auth();
        
        let state_key = Symbol::new(&e, "STATE");
        let state: State = e.storage().instance().get(&state_key).unwrap();
        
        match state {
            State::Pending => {
                 e.storage().instance().set(&state_key, &State::Submitted);

                 // Emit Event: WorkSubmitted
                 e.events().publish(
                     (Symbol::new(&e, "MicroEscrow"), Symbol::new(&e, "WorkSubmitted")),
                     freelancer.clone()
                 );
            },
            _ => panic!("Invalid state transition"),
        }
    }

    pub fn release_funds(e: Env, client: Address) {
        let client_key = Symbol::new(&e, "CLIENT");
        let client_stored: Address = e.storage().instance().get(&client_key).unwrap();
        
        if client != client_stored {
            panic!("Not the authorized client");
        }
        client.require_auth();
        
        let state_key = Symbol::new(&e, "STATE");
        let state: State = e.storage().instance().get(&state_key).unwrap();
        
        match state {
            State::Submitted => {
                 e.storage().instance().set(&state_key, &State::Released);
                 
                 let freelancer_key = Symbol::new(&e, "FREELANCER");
                 let freelancer: Address = e.storage().instance().get(&freelancer_key).unwrap();
                 
                 let fee_collector_key = Symbol::new(&e, "FEE_COLLECTOR");
                 let fee_collector: Address = e.storage().instance().get(&fee_collector_key).unwrap();

                 let amount_key = Symbol::new(&e, "AMOUNT");
                 let amount: i128 = e.storage().instance().get(&amount_key).unwrap();
                 
                 let token_key = Symbol::new(&e, "TOKEN");
                 let token: Address = e.storage().instance().get(&token_key).unwrap();
                 
                 // Calculate 2% fee and 98% freelancer amount
                 let fee_amount = amount * 2 / 100;
                 let freelancer_amount = amount - fee_amount;

                 let token_client = token::Client::new(&e, &token);

                 // Send 98% to freelancer
                 token_client.transfer(&e.current_contract_address(), &freelancer, &freelancer_amount);
                 
                 // Send 2% to fee collector contract address directly
                 token_client.transfer(&e.current_contract_address(), &fee_collector, &fee_amount);

                 // Inter-contract call: track fee in FeeCollector
                 let fee_collector_client = FeeCollectorClient::new(&e, &fee_collector);
                 fee_collector_client.track_fee(&fee_amount);

                 // Emit Event: FundsReleased
                 e.events().publish(
                     (Symbol::new(&e, "MicroEscrow"), Symbol::new(&e, "FundsReleased")),
                     (freelancer.clone(), freelancer_amount, fee_amount)
                 );
            },
             _ => panic!("Funds can only be released after work is submitted"),
        }
    }
    
    pub fn get_state(e: Env) -> State {
        e.storage().instance().get(&Symbol::new(&e, "STATE")).expect("Not initialized") 
    }
}

#[cfg(test)]
mod test;
