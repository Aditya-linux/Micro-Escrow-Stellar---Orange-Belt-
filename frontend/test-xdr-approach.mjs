import { StrKey, xdr } from "@stellar/stellar-sdk";

const XLM_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVVNIXF47ZG2FB2RMQQVU2HHGCYSC";

console.log("Testing StrKey.decodeContract...");
try {
    const contractBytes = StrKey.decodeContract(XLM_TOKEN_ID);
    console.log("StrKey.decodeContract succeeded, bytes length:", contractBytes.length);

    const scAddress = xdr.ScAddress.scAddressTypeContract(contractBytes);
    const scVal = xdr.ScVal.scvAddress(scAddress);
    console.log("ScVal created successfully:", JSON.stringify(scVal));
    console.log("SUCCESS!");
} catch (e) {
    console.error("FAILED:", e.message);
}
