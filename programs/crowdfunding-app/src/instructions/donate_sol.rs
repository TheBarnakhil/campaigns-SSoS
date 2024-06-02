use anchor_lang::prelude::*;

use crate::states::*;

pub fn donate_sol(ctx: Context<DonateSol>, amount: u64) -> Result<()> {

    let ix = anchor_lang::solana_program::system_instruction::transfer(
        ctx.accounts.user.key,
        ctx.accounts.campaign.to_account_info().key,
        amount,
    );

    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.campaign.to_account_info()
        ]
    )?;

    (&mut ctx.accounts.campaign).total_funding += amount;
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u8)]
pub struct DonateSol<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}