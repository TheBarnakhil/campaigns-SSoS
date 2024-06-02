import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CrowdfundingApp } from "../target/types/crowdfunding_app";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";

const CAMPAIGN_SEED = "campaign";

describe("crowdfunding-app", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CrowdfundingApp as Program<CrowdfundingApp>;

  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();

  const name_alice1 = "Alice Campaign";
  const description_alice1 = "Alice's first campaign";

  const name_alice2 = "Alice Campaign 2";
  const description_alice2 = "Alice's second campaign";

  const name_bob = "Bob Campaign";
  const description_bob = "Bob's campaign";

  const name_alice3 = "This Topic is too long bla bla bla bla bla bla bla bla bla bla bla bla";
  const desc_alice3 = "This topic is too long , but I wanna try it !!"


  const name_alice4 = "We have content too long";
  const desc = "ten bytes!"
  let desc_500_bytes = desc.repeat(50);
  const desc_alice4 = desc_500_bytes + "+1"

  const funding_goal = new anchor.BN(1000);

  describe("Campaign creation!", async () => {
    it("Alice creates her first campaign!", async () => {
      // Add your test here.

      await airdrop(provider.connection, alice.publicKey);
      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_alice1, alice.publicKey, program.programId);

      await program.methods.initialize(name_alice1, description_alice1, funding_goal).accounts(
        {
          campaign: campaign_pkey,
          user: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        }
      ).signers([alice]).rpc({ commitment: "confirmed" })

      await checkCampaign(
        program, campaign_pkey, alice.publicKey, name_alice1, description_alice1, funding_goal, campaign_bump
      )
    });

    it("Alice creates her second campaign!", async () => {
      // Add your test here.

      await airdrop(provider.connection, alice.publicKey);
      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_alice2, alice.publicKey, program.programId);

      await program.methods.initialize(name_alice2, description_alice2, funding_goal).accounts(
        {
          campaign: campaign_pkey,
          user: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        }
      ).signers([alice]).rpc({ commitment: "confirmed" })

      await checkCampaign(
        program, campaign_pkey, alice.publicKey, name_alice2, description_alice2, funding_goal, campaign_bump
      )
    });

    it("Cannot initialize campaign with name longer than 32 bytes!", async () => {

      let should_fail = "This Should Fail"
      try {
        const [campaign_pkey, campaign_bump] = getCampaignAddress(name_alice3, alice.publicKey, program.programId);

        await program.methods.initialize(name_alice3, desc_alice3, funding_goal).accounts(
          {
            user: alice.publicKey,
            campaign: campaign_pkey,
            systemProgram: anchor.web3.SystemProgram.programId
          }
        ).signers([alice]).rpc({ skipPreflight: true})
      } catch (error) {
        assert.strictEqual(error.message, "Max seed length exceeded");
        should_fail = "Failed"
      }
      assert.strictEqual(should_fail, "Failed")
    });

    it("Cannot initialize campaign with content longer than 500 bytes!", async () => {
      let should_fail = "This Should Fail"
      try {
        const [campaign_pkey, campaign_bump] = getCampaignAddress(name_alice4, alice.publicKey, program.programId);

        await program.methods.initialize(name_alice4, desc_alice4, funding_goal).accounts(
          {
            user: alice.publicKey,
            campaign: campaign_pkey,
            systemProgram: anchor.web3.SystemProgram.programId
          }
        ).signers([alice]).rpc({ commitment: "confirmed" })
      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(err.error.errorCode.code, "DescriptionTooLong");
        should_fail = "Failed"
      }
      assert.strictEqual(should_fail, "Failed")
    });

    it("Bob creates his first campaign!", async () => {
      // Add your test here.

      await airdrop(provider.connection, bob.publicKey);
      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_bob, bob.publicKey, program.programId);

      await program.methods.initialize(name_bob, description_bob, funding_goal).accounts(
        {
          campaign: campaign_pkey,
          user: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        }
      ).signers([bob]).rpc({ commitment: "confirmed" })

      await checkCampaign(
        program, campaign_pkey, bob.publicKey, name_bob, description_bob, funding_goal, campaign_bump
      )
    });
  });

  describe("Donation!", async () => {
    it("Alice donates 10 sol to Bob's campaign!", async () => {
      // Add your test here.

      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_bob, bob.publicKey, program.programId);

      await program.methods.donate(new anchor.BN(10)).accounts({
        campaign: campaign_pkey,
        user: alice.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).signers([alice]).rpc({ commitment: "confirmed" })
      
      await checkCampaign(
        program, campaign_pkey, bob.publicKey, name_bob, description_bob, funding_goal, campaign_bump
      )
      
      let campaignData = await program.account.campaign.fetch(campaign_pkey);

      assert.strictEqual(campaignData.totalFunding.toString(), "10")
    })

    it("Alice donates 10 sol to Alice's campaign!", async () => {
      // Add your test here.

      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_alice1, alice.publicKey, program.programId);

      await program.methods.donate(new anchor.BN(10)).accounts({
        campaign: campaign_pkey,
        user: alice.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).signers([alice]).rpc({ commitment: "confirmed" })
      
      await checkCampaign(
        program, campaign_pkey, alice.publicKey, name_alice1, description_alice1, funding_goal, campaign_bump
      )
      
      let campaignData = await program.account.campaign.fetch(campaign_pkey);

      assert.strictEqual(campaignData.totalFunding.toString(), "10")
    })
  })


  describe("Withdrawl!", async () => {
    it("Alice tries to withdraw 5 sol from Bob's campaign!", async () => {
      try{
        const [campaign_pkey, campaign_bump] = getCampaignAddress(name_bob, bob.publicKey, program.programId);
        
        await program.methods.withdraw(new anchor.BN(5)).accounts({
          campaign: campaign_pkey,
          user: alice.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        }).signers([alice]).rpc({ commitment: "confirmed" })
        
      }catch(error){
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(err.error.errorCode.code, "NoWithdrawAuthority");
      }
    })

    it("Bob withdraws 5 sol from Bob's campaign!", async () => {
      // Add your test here.

      const [campaign_pkey, campaign_bump] = getCampaignAddress(name_bob, bob.publicKey, program.programId);

      await program.methods.withdraw(new anchor.BN(5)).accounts({
        campaign: campaign_pkey,
        user: bob.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      }).signers([bob]).rpc({ commitment: "confirmed" })
      
      await checkCampaign(
        program, campaign_pkey, bob.publicKey, name_bob, description_bob, funding_goal, campaign_bump
      )
      
      let campaignData = await program.account.campaign.fetch(campaign_pkey);

      assert.strictEqual(campaignData.totalFunding.toString(), "5")
    })

    it("Bob tries to withdraw 15 sol from Bob's campaign which only has 5 sol!", async () => {
      // Add your test here.

      try{

        const [campaign_pkey, campaign_bump] = getCampaignAddress(name_bob, bob.publicKey, program.programId);
        
        await program.methods.withdraw(new anchor.BN(5)).accounts({
          campaign: campaign_pkey,
          user: bob.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId
        }).signers([bob]).rpc({ commitment: "confirmed" })
        
      }catch(error){
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(err.error.errorCode.code, "InsufficientFunds");
      }
    })
  })
});


async function airdrop(connection: any, address: any, amount = 10*LAMPORTS_PER_SOL) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}

function getCampaignAddress(name: string, author: PublicKey, programID: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(CAMPAIGN_SEED),
      author.toBuffer(),
      anchor.utils.bytes.utf8.encode(name)
    ], programID);
}

async function checkCampaign(
  program: anchor.Program<CrowdfundingApp>,
  campaign: PublicKey,
  user?: PublicKey,
  name?: string,
  description?: string,
  funding_goal?: anchor.BN,
  bump?: number,
) {
  let campaignData = await program.account.campaign.fetch(campaign);

  if (user) {
    assert.strictEqual(campaignData.owner.toString(), user.toString())

  }
  if (name) {
    const utf8ByteArray_name = stringToUtf8ByteArray(name);
    const paddedByteArray_name = padByteArrayWithZeroes(utf8ByteArray_name, 32);
    assert.strictEqual(campaignData.name.toString(), paddedByteArray_name.toString());
    assert.strictEqual(campaignData.nameLength.toString(), utf8ByteArray_name.length.toString());
  }
  if (description) {
    const utf8ByteArray_description = stringToUtf8ByteArray(description);
    const paddedByteArray_description = padByteArrayWithZeroes(utf8ByteArray_description, 500);
    assert.strictEqual(campaignData.description.toString(), paddedByteArray_description.toString());
  }
  if (funding_goal || funding_goal === new anchor.BN(0)) {
    assert.strictEqual(campaignData.fundingGoal.toString(), funding_goal.toString())
  }
  if (bump) {
    assert.strictEqual(campaignData.bump.toString(), bump.toString())

  }
}

function stringToUtf8ByteArray(inputString: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(inputString);
}

// Function to pad a byte array with zeroes to a specified length
function padByteArrayWithZeroes(byteArray: Uint8Array, length: number): Uint8Array {
  if (byteArray.length >= length) {
    return byteArray;
  }

  const paddedArray = new Uint8Array(length);
  paddedArray.set(byteArray, 0);
  return paddedArray;
}