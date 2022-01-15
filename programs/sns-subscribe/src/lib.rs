use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.len() == 0 {
        return Err(ProgramError::InvalidInstructionData);
    }

    if instruction_data[0] == 0 {
        return subscribe_user(
            program_id,
            accounts,
            &instruction_data[1..instruction_data.len()],
        );
    }
    msg!("Invalid instruction");
    Err(ProgramError::InvalidInstructionData)
}

pub fn subscribe_user(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    next_account_info(accounts_iter)?;
    let admin_account = next_account_info(accounts_iter)?;
    let writing_account = next_account_info(accounts_iter)?;
    if writing_account.owner != program_id {
        msg!("Writing account should be owned by programId");
        return Err(ProgramError::IncorrectProgramId);
    }
    let rent_exemption = Rent::get()?.minimum_balance(writing_account.data_len());
    if rent_exemption > **writing_account.lamports.borrow() {
        msg!("Insufficient funds");
        return Err(ProgramError::InsufficientFunds);
    }
    let mut input_data = User::try_from_slice(&instruction_data).expect("error");
    input_data.admin = *admin_account.key;
    input_data.serialize(&mut &mut writing_account.try_borrow_mut_data()?[..])?;
    Ok(())
}
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct User {
    pub user_key: Pubkey,
    pub fcm_token: String,
    pub admin: Pubkey,
}
