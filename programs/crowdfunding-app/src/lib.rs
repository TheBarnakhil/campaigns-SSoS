use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::instructions::*;

pub mod states;
pub mod instructions;
pub mod errors;

declare_id!("mSgYAxrWrzVCQsiBs8yHVwHjedadMTqbnRmAGv5vPMW");

#[program]
pub mod crowdfunding_app {
    use super::*;
    // use anchor_lang::solana_program::entrypoint::ProgramResult;

    pub fn initialize(ctx: Context<CreateCampaign>, name: String, description: String, funding_goal : u64) -> Result<()> {
        create_campaign(ctx, name, description, funding_goal)
    }

    pub fn donate(ctx: Context<DonateSol>, amount: u64) -> Result<()> {
        donate_sol(ctx, amount)
    }

    pub fn withdraw(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        withdraw_sol(ctx, amount)
    }
}