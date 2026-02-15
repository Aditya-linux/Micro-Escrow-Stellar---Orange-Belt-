import { Contract, Address } from "@stellar/stellar-sdk";

const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVVNIXF47ZG2FB2RMQQVU2HHGCYSC".trim();

console.log("Token ID length:", XLM_TOKEN_ID.length);
console.log("Token ID chars:", XLM_TOKEN_ID.split('').map(c => c.charCodeAt(0)));

console.log("Testing Contract class...");
try {
    const contract = new Contract(XLM_TOKEN_ID);
    console.log("Contract created successfully:", contract.contractId());
} catch (e) {
    console.error("Contract class failed:", e.message);
}
