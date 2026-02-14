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
pub struct MicroEscrow;

#[contractimpl]
impl MicroEscrow {
    pub fn initialize(e: Env, client: Address, freelancer: Address, token: Address, amount: i128) {
        let state_key = Symbol::new(&e, "STATE");
        if e.storage().instance().has(&state_key) {
            panic!("Already initialized");
        }
        
        client.require_auth();

        // Transfer funds from client to contract
        // Note: Client must approve this transfer (or the call must be authorized by client which it is)
        // But for `transfer_from` to work, or simple `transfer`, the client calls `token.transfer(client, contract, amount)`
        // BUT, the contract cannot make the client send funds unless the client signed a transaction to do so.
        // In this flow, `initialize` is called by `client`.
        // So `client` can sign the `initialize` call.
        // Only if `token.transfer` is called *by the client* it works.
        // If the contract calls `token.transfer_from`, it needs allowance.
        // EASIER: The client sends funds to the contract address MANUALLY or via a separate operation in the same transaction.
        // OR: Use `transfer` from `client` to `current_contract_address`. Since `client` authorized the call, does that authorize the transfer?
        // NO. The token contract checks authorization.
        // `token::Client::new(&e, &token).transfer(&client, &e.current_contract_address(), &amount);`
        // This call requires `client` auth. Since `initialize` has `client.require_auth()`, this *might* work if the token contract supports bubbling auth or if the invocation includes it.
        // Standard pattern: Client calls `token.approve` then contract calls `transfer_from`.
        // OR: Simple "Client sends token to contract, THEN calls initialize".
        // Let's assume the standard Soroban pattern where we use `transfer` and correct auth.
        // Since `client` is the invoker of `initialize`, the `transfer` call will require `client` auth again.
        // If we use `client.require_auth()`, the auth is verified.
        // The `token.transfer` will add another auth requirement.
        // If the client signs the transaction with both invocations or if the auth tree handles it.
        // Let's stick to: Contract calls `transfer` from client to self.
        
        let token_client = token::Client::new(&e, &token);
        token_client.transfer(&client, &e.current_contract_address(), &amount);

        e.storage().instance().set(&Symbol::new(&e, "CLIENT"), &client);
        e.storage().instance().set(&Symbol::new(&e, "FREELANCER"), &freelancer);
        e.storage().instance().set(&Symbol::new(&e, "TOKEN"), &token);
        e.storage().instance().set(&Symbol::new(&e, "AMOUNT"), &amount);
        e.storage().instance().set(&state_key, &State::Pending);
    }

    pub fn submit_work_link(e: Env, freelancer: Address) {
        let freelancer_key = Symbol::new(&e, "FREELANCER");
        let freelancer_stored: Address = e.storage().instance().get(&freelancer_key).unwrap();
        
        // Verify the caller is the freelancer
        // Note: The argument `freelancer` is passed to check auth, but we should verify it matches stored.
        if freelancer != freelancer_stored {
            panic!("Not the authorized freelancer");
        }
        freelancer.require_auth();
        
        let state_key = Symbol::new(&e, "STATE");
        let state: State = e.storage().instance().get(&state_key).unwrap();
        
        match state {
            State::Pending => {
                 e.storage().instance().set(&state_key, &State::Submitted);
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
                 
                 let amount_key = Symbol::new(&e, "AMOUNT");
                 let amount: i128 = e.storage().instance().get(&amount_key).unwrap();
                 
                 let token_key = Symbol::new(&e, "TOKEN");
                 let token: Address = e.storage().instance().get(&token_key).unwrap();
                 
                 let token_client = token::Client::new(&e, &token);
                 token_client.transfer(&e.current_contract_address(), &freelancer, &amount);
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
