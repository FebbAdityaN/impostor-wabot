/**
   * @febbyadityan
   * github.com/FebbAdityaN
   * Please don't delete it, to respect the author.
*/

"use strict";
import makeWASocket, {
	DisconnectReason,
	useMultiFileAuthState,
	generateWAMessageFromContent,
	fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import { Boom } from '@hapi/boom';
import figlet from 'figlet';
import pino from 'pino';
import fs from 'fs';
import moment from 'moment';
import chalk from 'chalk';
import clui from 'clui';
import path from 'path';
import readline from 'readline';

import handler from './handler.js';
import { serialize } from './src/myfunc.js';

const { Spinner } = clui;
const time = moment(new Date()).format('HH:mm:ss DD/MM/YYYY');

const readlineConfig = {
	input: process.stdin,
	output: process.stdout
};

const rl = readline.createInterface(readlineConfig);
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

function title() {
	// console.clear()
	console.log(chalk.bold.green(figlet.textSync('Wabot Game', {
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default',
		width: 80,
		whitespaceBreak: false
	})))
	console.log(chalk.yellow(`\n                      ${chalk.yellow('[ Created By Febb ]')}\n\n${chalk.red('WhatsApp Bot')} : ${chalk.white('Keishu')}\n${chalk.red('Follow Insta Dev')} : ${chalk.white('@febbyadityan')}\n${chalk.red('Message Me On WhatsApp')} : ${chalk.white('+62 857-7026-9605')}\n`))
}

const startWhatsApp = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(`./session`);
	const { version } = await fetchLatestBaileysVersion();
	const sock = makeWASocket({
		version,
		auth: state,
		printQRInTerminal: false,
		logger: pino({ level: "silent" }),
		// browser: ["Keishu", "Chrome", "1.0.0"],
	});
	if (!sock.authState.creds.registered) {
		const phoneNumber = await question('Your number for WhatsApp Bot:')
		const code = await sock.requestPairingCode(phoneNumber)
		console.log('Pairing Code: ' + code)
	}
	sock.ev.on('creds.update', saveCreds)
	
	sock.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect } = update
		if (connection === "close") {
			const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.code;
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
			console.log("❌ Koneksi terputus:", statusCode || reason, lastDisconnect?.error?.message);
			if (reason === DisconnectReason.badSession) {
				console.log("Bad Session File, Please Delete Session and Scan Again");
				sock.logout();
			} else if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut) {
				console.log("🔁 Connection closed/lost/timedout, reconnecting...");
				startWhatsApp();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log("⚠️ Connection Replaced, Please close current session first");
				sock.logout();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log("📴 Device logged out, please scan again");
				sock.logout();
			} else if (reason === DisconnectReason.restartRequired) {
				console.log("♻️ Restart required, restarting...");
				startWhatsApp();
			} else {
				console.log("⚙️ Unknown disconnect reason, reconnecting...");
				startWhatsApp(); // fallback reconnect
			}
		}
		// console.log("Connected...", update);
	})

	title()
	
	sock.ev.on('messages.upsert', async m => {
		if (!m.messages) return;
		var msg = m.messages[0]
		try { if (msg.message.messageContextInfo) delete msg.message.messageContextInfo } catch { }
		msg = serialize(sock, msg)
		msg.isBaileys = msg.key.id.startsWith('3EB0')
		handler(sock, msg, m) 
	})

	sock.reply = (from, content, msg) => sock.sendMessage(from, { text: content }, { quoted: msg })
    
	sock.sendMessageFromContent = async(jid, message, options = {}) => {
		var option = { contextInfo: {}, ...options }
		var prepare = await generateWAMessageFromContent(jid, message, option)
		await sock.relayMessage(jid, prepare.message, { messageId: prepare.key.id })
		return prepare
	}
	return sock
}

startWhatsApp()
.catch(e => console.log(e))