import { Address } from "@stellar/stellar-sdk";

const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVVNIXF47ZG2FB2RMQQVU2HHGCYSC";

try {
    console.log("Testing Address class with valid ID...");
    const addr = new Address(XLM_TOKEN_ID);
    console.log("Address created successfully:", addr.toString());
    console.log("ScVal:", JSON.stringify(addr.toScVal()));
} catch (e) {
    console.error("Address class FAILED:", e.message);
}
