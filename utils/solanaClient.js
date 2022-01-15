import {
    Connection,
    SystemProgram,
    Transaction,
    PublicKey,
    TransactionInstruction,
    sendAndConfirmTransaction,
    Keypair,
    clusterApiUrl,
    signTransaction,
} from '@solana/web3.js';
import {serialize, deserialize} from 'borsh';
global.Buffer = require('buffer').Buffer;
import base58 from 'bs58';
import nacl from 'tweetnacl';

const cluster = clusterApiUrl('devnet');
const connection = new Connection(cluster, 'confirmed');
const programId = new PublicKey('34Vf55T37KWDg4Ab53BSfDDsoCAPAQdRPDjiurrjQ6UE');
const seed = Uint8Array.from([
    68, 44, 182, 59, 45, 149, 137, 227, 169, 202, 59, 118, 198, 4, 162, 19, 193,
    192, 39, 20, 42, 60, 64, 25, 219, 65, 49, 178, 153, 236, 184, 125, 32, 215,
    98, 64, 167, 213, 224, 100, 225, 134, 92, 77, 53, 255, 110, 164, 71, 99,
    220, 165, 59, 77, 19, 217, 165, 49, 165, 40, 220, 202, 251, 193,
]);

export const subscribeUser = async ({address, token}) => {
    const userPubkey = new PublicKey(address);
    if (!PublicKey.isOnCurve(userPubkey.toBuffer())) {
        return 'Please enter a valid address';
    }
    const users = await getAllUsers();
    const userExists = users.some(
        user => base58.encode(user.user_key).toString() === address,
    );
    const tokenExists = users.some(user => user.fcm_token === token);
    if (userExists && tokenExists) {
        return 'User already subscribed';
    }
    const signer = await Keypair.fromSecretKey(seed);
    const secretKey = signer.secretKey;

    const adminKey = new PublicKey(
        '8tA5LaLxTaBM5WjhMS8cqCjXU91r8Mqhoh9dThN7xpF2',
    );

    const SEED = 'mahesh' + Math.random().toString();
    const newAccountPair = await Keypair.generate();
    let user = new User({
        fcm_token: token,
        user_key: userPubkey.toBuffer(),
        admin: adminKey.toBuffer(),
    });

    const data = serialize(User.schema, user);
    const data_to_send = new Uint8Array([0, ...data]);
    const lamports = await connection.getMinimumBalanceForRentExemption(
        data.length,
    );

    const balance = await connection.getBalance(signer.publicKey);
    if (balance < lamports) {
        await connection.requestAirdrop(signer.publicKey, 1000000000);
    }

    const writing_account = SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: newAccountPair.publicKey,
        lamports: lamports,
        space: data.length,
        programId: programId,
    });

    const txInstruxtion = new TransactionInstruction({
        keys: [
            {pubkey: signer.publicKey, isSigner: true, isWritable: false},
            {pubkey: adminKey, isSigner: false, isWritable: false},
            {
                pubkey: newAccountPair.publicKey,
                isSigner: false,
                isWritable: true,
            },
        ],
        programId: programId,
        data: data_to_send,
    });

    const transaction = new Transaction();
    transaction.add(writing_account);
    transaction.add(txInstruxtion);
    transaction.feePayer = signer.publicKey;
    const hash = await connection.getRecentBlockhash();
    transaction.recentBlockhash = hash.blockhash;

    const sign = nacl.sign.detached(transaction.serializeMessage(), secretKey);
    const newAccountSign = nacl.sign.detached(
        transaction.serializeMessage(),
        newAccountPair.secretKey,
    );
    transaction.addSignature(signer.publicKey, sign);
    transaction.addSignature(newAccountPair.publicKey, newAccountSign);

    let signature = await connection.sendRawTransaction(
        transaction.serialize(),
    );

    const result = await connection.confirmTransaction(signature);
    return 'Subscription success';
};

const getAllUsers = async () => {
    const accounts = await connection.getProgramAccounts(programId);
    const users = [];
    accounts.forEach(e => {
        const user = deserialize(User.schema, User, e.account.data);
        users.push(user);
    });
    return users;
};

class User {
    constructor(properties) {
        Object.keys(properties).forEach(key => {
            this[key] = properties[key];
        });
    }

    static schema = new Map([
        [
            User,
            {
                kind: 'struct',
                fields: [
                    ['user_key', [32]],
                    ['fcm_token', 'string'],
                    ['admin', [32]],
                ],
            },
        ],
    ]);
}
