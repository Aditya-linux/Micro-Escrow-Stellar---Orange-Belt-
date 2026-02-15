import { nativeToScVal } from "@stellar/stellar-sdk";

const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVVNIXF47ZG2FB2RMQQVU2HHGCYSC";

try {
    console.log("Testing nativeToScVal with valid ID...");
    // @ts-ignore
    const scVal = nativeToScVal(XLM_TOKEN_ID, { type: 'address' });
    console.log("SUCCESS:", JSON.stringify(scVal));
} catch (e) {
    console.error("FAILED:", e.message);
}
