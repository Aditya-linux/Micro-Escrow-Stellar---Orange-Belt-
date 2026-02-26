#![cfg(test)]

use super::{FeeCollector, FeeCollectorClient, MicroEscrow, MicroEscrowClient, State};
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_correct_initialization() {
    let e = Env::default();
    e.mock_all_auths();

    let contract_id = e.register_contract(None, MicroEscrow);
    let client = MicroEscrowClient::new(&e, &contract_id);

    let fee_collector_id = e.register_contract(None, FeeCollector);

    let user_client = Address::generate(&e);
    let freelancer = Address::generate(&e);
    let token_admin = Address::generate(&e);
    
    // Setup token
    let token = e.register_stellar_asset_contract_v2(token_admin.clone()).address().clone();
    let token_client = soroban_sdk::token::Client::new(&e, &token);
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&e, &token);
    
    token_admin_client.mint(&user_client, &1000);

    // Initialize
    client.initialize(&user_client, &freelancer, &fee_collector_id, &token, &500);

    // Verify state
    let state = client.get_state();
    assert_eq!(state, State::Pending);
    
    // Verify funds transfer (Contract should have 500)
    assert_eq!(token_client.balance(&contract_id), 500);
    assert_eq!(token_client.balance(&user_client), 500);
}

#[test]
#[should_panic(expected = "Funds can only be released after work is submitted")]
fn test_cannot_release_before_submission() {
    let e = Env::default();
    e.mock_all_auths();

    let contract_id = e.register_contract(None, MicroEscrow);
    let client = MicroEscrowClient::new(&e, &contract_id);

    let fee_collector_id = e.register_contract(None, FeeCollector);

    let user_client = Address::generate(&e);
    let freelancer = Address::generate(&e);
    let token_admin = Address::generate(&e);
    
    let token = e.register_stellar_asset_contract_v2(token_admin.clone()).address().clone();
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&e, &token);
    token_admin_client.mint(&user_client, &1000);

    client.initialize(&user_client, &freelancer, &fee_collector_id, &token, &500);
    
    // Try release immediately — should panic
    client.release_funds(&user_client);
}

#[test]
fn test_full_flow() {
    let e = Env::default();
    e.mock_all_auths();

    let contract_id = e.register_contract(None, MicroEscrow);
    let client = MicroEscrowClient::new(&e, &contract_id);

    let fee_collector_id = e.register_contract(None, FeeCollector);

    let user_client = Address::generate(&e);
    let freelancer = Address::generate(&e);
    let token_admin = Address::generate(&e);
    
    let token = e.register_stellar_asset_contract_v2(token_admin.clone()).address().clone();
    let token_client = soroban_sdk::token::Client::new(&e, &token);
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&e, &token);
    token_admin_client.mint(&user_client, &1000);

    client.initialize(&user_client, &freelancer, &fee_collector_id, &token, &500);

    // Freelancer submits work
    client.submit_work_link(&freelancer);
    assert_eq!(client.get_state(), State::Submitted);

    // Client releases funds
    client.release_funds(&user_client);
    assert_eq!(client.get_state(), State::Released);

    // Verify balances (98% to freelancer, 2% to fee collector)
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&freelancer), 490);
    assert_eq!(token_client.balance(&fee_collector_id), 10);
}

#[test]
#[should_panic]
fn test_submit_without_init() {
    let e = Env::default();
    e.mock_all_auths();

    let contract_id = e.register_contract(None, MicroEscrow);
    let client = MicroEscrowClient::new(&e, &contract_id);

    let freelancer = Address::generate(&e);
    
    // Attempt submit work without init — should panic with "Not initialized"
    client.submit_work_link(&freelancer);
}
