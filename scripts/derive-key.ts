/**
 * Helper to derive Stacks Private Key from Mnemonic
 *
 * Usage: npx tsx scripts/derive-key.ts "your mnemonic phrase here"
 */
import { generateWallet } from "@stacks/wallet-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.error("Please provide your mnemonic phrase as an argument.");
  console.error(
    'Usage: npx tsx scripts/derive-key.ts "word1 word2 ... word12"',
  );
  process.exit(1);
}

async function main() {
  try {
    const wallet = await generateWallet({
      secretKey: mnemonic,
      password: "", // Default password for most wallets
    });

    const account1 = wallet.accounts[0];
    const privateKey = account1.stxPrivateKey; // This gets the raw private key

    console.log("\n✅ Derived Private Key:");
    console.log(privateKey);
    console.log("\n(Add this to your .env.local as STACKS_PRIVATE_KEY)");
  } catch (error) {
    console.error("Failed to derive key:", error);
  }
}

main();
