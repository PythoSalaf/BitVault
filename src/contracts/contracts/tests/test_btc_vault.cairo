use starknet::ContractAddress;
use snforge_std::{declare, DeclareResultTrait, ContractClassTrait};

#[test]
fn test_contract_deployment() {
    let contract = declare("btc_vault").unwrap().contract_class();
    
    let owner: ContractAddress = 'owner'.try_into().unwrap();
    let wbtc: ContractAddress = 'wbtc_token'.try_into().unwrap();
    let rb_token: ContractAddress = 'rb_token'.try_into().unwrap();
    let pool_id: felt252 = 123456789;
    
    let constructor_calldata = array![
        owner.into(),
        wbtc.into(),
        pool_id,
        rb_token.into()
    ];

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    
    // Just verify the contract was deployed with a valid address
    assert(contract_address.into() != 0, 'Contract not deployed');
}

#[test]
fn test_multiple_deployments() {
    let contract_class = declare("btc_vault").unwrap().contract_class();
    
    // Deploy first instance
    let owner1: ContractAddress = 'owner1'.try_into().unwrap();
    let wbtc1: ContractAddress = 'wbtc1'.try_into().unwrap();
    let rb_token1: ContractAddress = 'rb_token1'.try_into().unwrap();
    
    let calldata1 = array![owner1.into(), wbtc1.into(), 123456789, rb_token1.into()];
    let (addr1, _) = contract_class.deploy(@calldata1).unwrap();
    
    // Deploy second instance
    let owner2: ContractAddress = 'owner2'.try_into().unwrap();
    let wbtc2: ContractAddress = 'wbtc2'.try_into().unwrap();
    let rb_token2: ContractAddress = 'rb_token2'.try_into().unwrap();
    
    let calldata2 = array![owner2.into(), wbtc2.into(), 987654321, rb_token2.into()];
    let (addr2, _) = contract_class.deploy(@calldata2).unwrap();
    
    // Verify different addresses
    assert(addr1.into() != 0, 'First contract not deployed');
    assert(addr2.into() != 0, 'Second contract not deployed');
    assert(addr1 != addr2, 'Contracts have same address');
}

#[test]
fn test_constructor_parameters() {
    let contract_class = declare("btc_vault").unwrap().contract_class();
    
    // Test with different parameter combinations
    let test_cases = array![
        ('owner_a', 'wbtc_a', 111, 'rb_a'),
        ('owner_b', 'wbtc_b', 222, 'rb_b'),
        ('owner_c', 'wbtc_c', 333, 'rb_c'),
    ];
    
    let mut i = 0;
    loop {
        if i >= test_cases.len() {
            break;
        }
        
        let (owner_felt, wbtc_felt, pool_id, rb_felt) = *test_cases.at(i);
        
        let owner: ContractAddress = owner_felt.try_into().unwrap();
        let wbtc: ContractAddress = wbtc_felt.try_into().unwrap();
        let rb_token: ContractAddress = rb_felt.try_into().unwrap();
        
        let calldata = array![owner.into(), wbtc.into(), pool_id, rb_token.into()];
        let (addr, _) = contract_class.deploy(@calldata).unwrap();
        
        assert(addr.into() != 0, 'Contract deployment failed');
        
        i += 1;
    };
} 