use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::CampaignError;

pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let user = &mut ctx.accounts.user;
    //Only the admin should be able to withdraw funds
    if campaign.owner != *user.key {
        return Err(CampaignError::NoWithdrawAuthority.into());
    };

    // Calculating the rent balance based on the length of the data
    let rent_balance = Rent::get()?.minimum_balance(campaign.to_account_info().data_len());

    //Checking if the campaign account has sufficient sol as compared to the amount being withdrawn
    //Subtracting the rent balance from the actual sol to make sure that we will have enough rent balance after withdrawl
    if **campaign.to_account_info().lamports.borrow() - rent_balance < amount {
        return Err(ProgramError::InsufficientFunds.into());
    };
    **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
    match user.to_account_info().try_borrow_mut_lamports() {
        Ok(mut lamports) => {
            **lamports += amount;
        }
        Err(e) => {
            msg!("Error: {:?}", e);
            return Err(ProgramError::AccountBorrowFailed.into());
        }
    }

    (&mut ctx.accounts.campaign).total_funding -= amount;

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u8)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
