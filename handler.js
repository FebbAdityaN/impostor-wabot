/**
   * @febbyadityan
   * github.com/FebbAdityaN
   * Please don't delete it, to respect the author.
*/

import * as imo from "./src/impostor/index.js";
import moment from "moment-timezone";
import fs from "fs";
import chalk from "chalk";
import { inspect } from "util";
import { players, room, game } from "./src/impostor/lib/function.js";
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const customLog = {
	cmd: (msg) => console.log(chalk.bgWhite(chalk.hex('21B9E9').bold('[COMMAND]')), msg)
}

moment().tz("Asia/Jakarta").format();

export default async (sock, msg, m) => {
	try {
		if (msg.key.fromMe) return
		const { type, isQuotedMsg, quotedMsg, mentioned, now, fromMe } = msg;
		const messageType = Object.keys(msg.message)[0]
		const from = msg.key.remoteJid;
		const chats = type === "conversation" && msg.message.conversation ? msg.message.conversation : type === "extendedTextMessage" && msg.message.extendedTextMessage.text ? msg.message.extendedTextMessage.text : ""
		const args = chats.split(" ");
		const command = chats.toLowerCase().split(" ")[0] || "";
		const isGroup = msg.key.remoteJid.endsWith("@g.us");
		const groupMetadata = isGroup ? await sock.groupMetadata(from) : ''
		const groupName = isGroup ? groupMetadata.subject : ''
		let sender
		if (msg.key.senderPn != undefined) {
			sender = msg.key.senderPn
		} else if (msg.key.participantPn != undefined) {
			sender = msg.key.participantPn
		} else if (msg.key.participantLid != undefined) {
			sender = msg.key.participantLid
		} else {
			sender = msg.key.remoteJid
		}
		// const isOwner = ownerNumber == sender ? true : ownerNumber.includes(sender) ? true : false;
		const pushname = msg.pushName;
		const query = chats.slice(command.length + 1, chats.length);
		const isCmd = chats.startsWith('#')
		
		const reply = (teks) => {
			sock.sendMessage(from, { text: teks }, { quoted: msg });
		};
		
		// Auto Read & Always Online
		sock.readMessages([msg.key]);
		sock.sendPresenceUpdate("available", from);
		
		if (!isGroup && isCmd && !fromMe) {
			customLog.cmd(`${command} [${args.length}] ` + moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') + ' from ' + chalk.bgWhite(chalk.black(pushname)))
		}
		if (isGroup && isCmd && !fromMe) {
			customLog.cmd(`${command} [${args.length}] ` + moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') + ' from ' + chalk.bgWhite(chalk.black(pushname + ` [${groupName}]`)))
		}
		
		switch(command) {
			case '#menu':
			case '#help':
				const strMenu = `👀 \`Command Impostor Game\` 🗣️
				
*[ Panduan Permainan ]*
> #guide

*[ Lobby ]*
> #daftar <nickname>
> #buatroom <nama room>
> #room / #listroom
> #join <nama room>

*[ Didalam Room ]*
> #start (memulai game)
> #leave (keluar room)
> #delete (menghapus sesi)

*[ Sesi Diprivate Chat ]*
> #clue <kata>
> #vote <nomor target>
> #listplayer / #playerlist

Note: Tanpa Menggunakan < >

<BETA ver>
\`Created by @febbyadityan\``
				reply(strMenu)
				break
			case '#guide':
				reply(imo.guide)
				break
			case '#daftar':
				if (!/^[a-z ]+$/i.test(query)) return reply('Hanya dapat menggunakan huruf!')
				const strDaftar = `\`Daftar User Impostor Game \`

Ketik \`#daftar <Nama>\`

(n) Tanpa menggunakan < >`
				if (args.length === 1) return reply(strDaftar)
				const user = imo.newPlayers(query, sender)
				if (user.status) {
					reply(user.msg)
				} else {
					reply(user.msg)
				}
				break
			case '#buatroom':
				const rDaftar = `\`Membuat Room Impostor\`

Ketik \`#buatroom <Nama Room>\`

(n) Tanpa menggunakan < >`
				if (args.length === 1) return reply(rDaftar)
				const newR = imo.newRoom(query, sender)
				if (newR.status) {
					let nameLocate = [];
					for (let n of players) {
						nameLocate.push(n.jid)
					}
					const indexJid = nameLocate.indexOf(sender)
					let gRoom = [];
					const createRoom = `\`Berhasil membuat Room Impostor\`
					
*Nama Room:* ${query}
*Status Room:* Waiting
*Jumlah Players:* ${newR.data.currentPlayers}/${newR.data.maxPlayers}

(n) Minimal 4 Players
_Menunggu player lain bergabung..._`
					reply(createRoom)
					const grup = await sock.groupCreate(query, [sender])
					for (let g of game) {
						gRoom.push(g.name)
					}
					let gName = sock.groupMetadata(grup.id)
					const indexRoom = gRoom.indexOf(gName.subject)
					sock.groupUpdateDescription(grup.id, `(#) ${grup.subject}\n\nLeader: ${players[indexJid].username} (${sender.replace('@s.whatsapp.net', '')})`);
					const code = await sock.groupInviteCode(grup.id)
					sock.groupMemberAddMode(grup.id, 'admin_add')
					sock.groupSettingUpdate(grup.id, 'locked')
					sock.sendMessage(sender, {text: 'Room berhasil dibuat dengan nama: ' + grup.subject + ' Dimohon untuk masuk grup terlebih dahulu : https://chat.whatsapp.com/' + code });
					room.push({
						name: query,
						gid: grup.id
					})
					fs.writeFileSync('./src/impostor/lib/db/room.json', JSON.stringify(room, null, 2))
				} else {
					reply(newR.msg)
				}
				break
			case '#join':
				const strjoinRoom = `
\`Panduan Join Room\`

*Penggunaan* : #join <nama room>
*Contoh*     : #join ABCD 

_Catatan : Untuk nama room tanpa tanda < dan >_`
				if (args.length === 1) return reply(strjoinRoom)
				const join = imo.joinRoom(query, sender)
				if (join.status) {
					let checkName = []
					for (let n of game) {
						checkName.push(n.name)
					}
					const indexName = checkName.indexOf(query)
					const grupIndex = room[indexName].gid
					const code = await sock.groupInviteCode(grupIndex)
					sock.sendMessage(sender, { text: 'Tidak dapat ditambahkan ke dalam grup, dimohon untuk masuk grup secara manual: https://chat.whatsapp.com/' + code });
				} else {
					reply(join.msg)
				}
				break
			case '#room':
			case '#listroom':
				let cekuser = imo.checkUser(sender)
				if (cekuser.status) {
					let strListRoom = `\`Menampilkan List Room Impostor\`\n`
					let leaders = [];
					for (let r of game) {
						strListRoom += `---------------------------------
					
*Nama Room* : ${r.name}
*Leader*    : ${r.leader_name} (${r.leader.replace(/@s.whatsapp.net/g, '')})
*Status*    : ${r.gameStarted ? 'Playing' : 'Waiting'}             ${cekuser.data.onRoom == r.name ? '<-- Room kamu' : ''}
*Players*   : ${r.data.currentPlayers}/${r.data.maxPlayers}\n\n`
						leaders.push(r.leader)
					}
					reply(`${strListRoom}---------------------------------\nKetik \`#join <nama room>\`\nUntuk bergabung kedalam room.`)
				} else {
					reply(cekuser.status)
				}
				break
			case '#start':
				if (!isGroup) return reply('Perintah ini hanya dapat dijalankan didalam grup!')
				const grupCheck = await imo.checkRoom(groupName)
				if (grupCheck.data.data.currentPlayers <= 4) {
					return reply(`Game tidak dapat dimulai.\n\nPlayer di grup ini baru: \`${grupCheck.data.data.currentPlayers}/5 Players\`\n(n) Minimal 4 & Maksimal 5 Players.\n\nAjak temanmu untuk bermain bersama!`)
				} else {
					const startGames = await imo.startGame(groupName, sender)
					if (startGames.status) {
						let roomList = []
						for (let r of game) {
							roomList.push(r.name)
						}
						const roomIndex = roomList.indexOf(groupName)
						let gid = [];
						for (let i of room) {
							gid.push(i.name)
						}
						const indexJid = gid.indexOf(groupName)
						for (const player of game[roomIndex].players) {
							const playerRole = game[roomIndex].roles[player.jid];
							if (playerRole === 'Impostor') {
								await sock.sendMessage(player.jid, {text: `Kamu adalah: \`Impostor\`\nHati Hati Ketahuan Ya!`})
							}
							if (playerRole === 'Human') {
								await sock.sendMessage(player.jid, {text: `Kata kunci: *${game[roomIndex].word}*\nJangan terlalu detail memberikan clue, agar Impostor tidak mengetahuinya.`});
							}
						}
						sock.groupSettingUpdate(from, 'announcement')
						reply('*[ GAME DIMULAI ]*\n\nBerhasil memberikan role kepada masing masing pemain, cek pesan pribadi yang dikirimkan oleh Bot.\n\nJika kamu kebingungan, kamu dapat mengetik *#guide* diprivate chat bot.')
						await delay(1500)
						const totalPlayers = game[roomIndex].players.length;
						const expectedJid = game[roomIndex].turnOrder[0]
						const currentPlayer = game[roomIndex].players.find(p => p.jid === expectedJid)
						await delay(1500)
						sock.sendMessage(from, {text: `Sekarang adalah sesi memberikan clue.\n\nDimulai dengan *${currentPlayer.name}* yang memberikan clue pertama.`})
					} else {
						reply(startGames.msg)
					}
				}
				break
			case '#clue':
				if (isGroup) return reply('Perintah ini hanya dapat dijalankan di private chat!')
				if (args.length === 1) return reply('Sertakan clue nya!')
				if (!/^\S+$/.test(query)) return reply('Kamu hanya dapat mengirimkan 1 Kata saja!')
				const inputClue = query.charAt(0).toUpperCase() + query.toLowerCase().slice(1);
				let usCheck = await imo.checkUser(sender)
				let startClue = await imo.clue(sender, inputClue)
				if (startClue.status) {
					let nGroup = [];
					for (let n of room) {
						nGroup.push(n.name)
					}
					const roomIndex = nGroup.indexOf(usCheck.data.onRoom)
					const expectedJid = game[roomIndex].turnOrder[game[roomIndex].currentPlayerIndex]
					const currentPlayer = game[roomIndex].players.find(p => p.jid === expectedJid)
					const exJid = game[roomIndex].turnOrder[game[roomIndex].currentPlayerIndex - 1]
					const curPlayer = game[roomIndex].players.find(p => p.jid === exJid)
					reply('Berhasil memberikan clue.')
					sock.sendMessage(room[roomIndex].gid, {text: `*${curPlayer.name}* telah memberikan clue: *${inputClue}*`}).then(response => {
						if (startClue.isDone) {
							// sesi voting dimulai
							sock.groupSettingUpdate(room[roomIndex].gid, 'not_announcement')
							sock.sendMessage(room[roomIndex].gid, {text: `Sesi voting dimulai.\nMulai voting diprivate chat bot.\n\nKalian dapat berdiskusi terlebih dahulu didalam grup, jika kamu belum yakin siapa yang menjadi Impostor.`})
						} else {
							sock.sendMessage(room[roomIndex].gid, {text: `*${curPlayer.name}* telah memberikan clue: *${inputClue}*.\n\nSekarang adalah giliran *${currentPlayer.name}* yang memberikan clue.`, edit: response.key})
						}
					})
				} else {
					reply(startClue.msg)
				}
				break
			case '#out':
			case '#leave':
			case '#keluar':
				let userCheck = await imo.leaveRoom(sender)
				if (userCheck.status) {
					reply(userCheck.msg)
				} else {
					reply(userCheck.msg)
				}
				break
			case '#delete':
				if (!isGroup) return reply('Perintah ini hanya dapat dijalankan didalam grup yang digunakan untuk bermain Impostor Game!')
				let rCheck = await imo.deleteRoom(sender, groupName)
				if (rCheck.status) {
					reply('Sesi berhasil dihapuskan, silahkan keluar dari group.')
					await delay(2000)
					await sock.groupLeave(from)
				} else {
					reply(rCheck.msg)
				}
				break
			case '#listplayer':
			case '#listplayers':
			case '#playerlist':
			case '#playerslist':
				if (isGroup) return reply('Perintah ini hanya dapat dijalankan di private chat!')
				let cekUser = await imo.checkUser(sender)
				if (cekUser.data.onRoom == null) {
					reply('Kamu tidak berada didalam room.')
				} else if (cekUser.status) {
					let gameRoom = [];
					for (let n of game) {
						gameRoom.push(n.name)
					}
					const indexRoom = gameRoom.indexOf(cekUser.data.onRoom)
					let strListVote = `\`Menampilkan List Players\`\n\n`
					let u = 1;
					for (let p of game[indexRoom].players) {
						strListVote += `${u}. ${p.name} (${p.jid.split('@')[0]})\n`
						u++;
					}
					reply(`${strListVote}\nUntuk melakukan Voting:\n#vote <nomor players>`)
				} else {
					reply(cekUser.msg)
				}
				break
			case '#vote':
				if (isGroup) return reply('Perintah ini hanya dapat dijalankan di private chat!')
				if (args.length === 1) return reply('Sertakan nomor nya!')
				if (!/^\d+$/.test(args[1])) return reply('Invalid! Input angka saja.')
				let metagrup = await imo.checkUser(sender)
				const voteTime = await imo.voting(metagrup.data.onRoom, sender, args[1])
				if (voteTime.status) {
					let grupID = [];
					for (let n of game) {
						grupID.push(n.name)
					}
					const roomIndex = grupID.indexOf(metagrup.data.onRoom)
					let gid = [];
					for (let i of room) {
						gid.push(i.name)
					}
					const indexJid = gid.indexOf(metagrup.data.onRoom)
					let checkU = imo.checkUser(sender)
					reply('Berhasil memberikan vote.')
					sock.sendMessage(room[indexJid].gid, {text: `Vote: ${game[roomIndex].voteCounts}/${game[roomIndex].data.currentPlayers}\n${checkU.data.username} telah melakukan vote.`})
					await delay(2000)
					if (game[roomIndex].voteCounts == game[roomIndex].data.currentPlayers) {
						const hasil = {};
						for (const user in game[roomIndex].votes) {
							const target = game[roomIndex].votes[user];
							if (hasil[target]) {
								hasil[target]++;
							} else {
								hasil[target] = 1;
							}
						}
						let mayoritas = null;
						let suaraTerbanyak = 0;
						let targetSeri = [];
						for (const target in hasil) {
							let jumlahSuara = hasil[target];
							if (jumlahSuara > suaraTerbanyak) {
								suaraTerbanyak = jumlahSuara;
								mayoritas = target;
								targetSeri = [];
							} else if (jumlahSuara === suaraTerbanyak) {
								if (mayoritas) {
									targetSeri.push(mayoritas);
								}
								targetSeri.push(target);
								mayoritas = null;
							}
						}
						if (targetSeri.length > 0) {
							let listData = [];
							let menData = [];
							let i = 1;
							for (const key in hasil) {
								listData.push(`${i}. @${key.split('@')[0]} = ${hasil[key]} Suara`);
								menData.push(key)
								i++;
							}
							const roles = Object.keys(game[roomIndex].roles);
							const isImpostor = roles.find(role => game[roomIndex].roles[role] === 'Impostor');
							sock.sendMessage(room[indexJid].gid, {text: `\`Hasil Voting:\`\n\n${listData.join('\n')}\n\nTidak ada pemain yang mendapatkan suara mayoritas.`, mentions: menData})
							await delay(1500)
							sock.sendMessage(room[indexJid].gid, {text: `Impostor memenangkan game karena tidak ketahuan. Impostornya adalah @${isImpostor.split('@')[0]}.`, mentions: [isImpostor]})
							imo.stopGame(game[roomIndex].name)
							await delay(3000)
							return sock.sendMessage(room[indexJid].gid, {text: `\`PERMAINAN SELESAI\`\n\nJika kalian ingin bermain kembali, kalian dapat mengetik *#start* untuk memulainya lagi.\n\nJika kalian semua ingin keluar dari grup, kalian dapat mengetik *#delete* sebelum keluar dari grup.\n\nTerimakasih telah bermain.\n\`\`\`Created by @febbyadityan\`\`\``})
						} else if (mayoritas) {
							const roles = Object.keys(game[roomIndex].roles);
							const isImpostor = roles.find(role => game[roomIndex].roles[role] === 'Impostor');
							const isHuman = roles.find(role => game[roomIndex].roles[role] === 'Human');
							const playerRole = game[roomIndex].roles[mayoritas];
							if (mayoritas == isImpostor) {
								sock.sendMessage(room[indexJid].gid, {text: `\`Hasil Voting\`\n\n@${mayoritas.split('@')[0]} sebagai \`Impostor\` berhasil ditebak!\n\n                 - Game Selesai -`, mentions: [mayoritas]})
								imo.stopGame(game[roomIndex].name)
								await delay(3000)
								return sock.sendMessage(room[indexJid].gid, {text: `\`PERMAINAN SELESAI\`\n\nJika kalian ingin bermain kembali, kalian dapat mengetik *#start* untuk memulainya lagi.\n\nJika kalian semua ingin keluar dari grup, kalian dapat mengetik *#delete* sebelum keluar dari grup.\n\nTerimakasih telah bermain.\n\`\`\`Created by @febbyadityan\`\`\``})
							}
							if (mayoritas == isHuman) {
								let userJid = [];
								for (let n of players) {
									userJid.push(n.jid)
								}
								const indexUser = userJid.indexOf(mayoritas)
								sock.sendMessage(room[indexJid].gid, {text: `@${mayoritas.split('@')[0]} bukanlah Impostor, kalian kalah dan Impostor memenangkan gamenya:(`, mentions: [mayoritas]})
								sock.sendMessage(room[indexJid].gid, {text: `Dan Impostornya adalah @${isImpostor}, selamat kamu memenangkan gamenya!`, mentions: [isImpostor]})
								imo.stopGame(game[roomIndex].name)
								await delay(3000)
								return sock.sendMessage(room[indexJid].gid, {text: `\`PERMAINAN SELESAI\`\n\nJika kalian ingin bermain kembali, kalian dapat mengetik *#start* untuk memulainya lagi.\n\nJika kalian semua ingin keluar dari grup, kalian dapat mengetik *#delete* sebelum keluar dari grup.\n\nTerimakasih telah bermain.\n\`\`\`Created by @febbyadityan\`\`\``})
							}
						}
						fs.writeFileSync('./src/impostor/lib/db/roomgame.json', JSON.stringify(game, null, 2))
					}
				} else {
					reply(voteTime.msg)
				}
				break
			case '#e':
				try {
					let evaled = await eval(query)
					if (typeof evaled !== "string")
					evaled = inspect(evaled);
					reply(`${evaled}`);
				} catch (e) {
					reply(`${e}`)
				}
				break
			default:
		}
	} catch (e) {
		console.error(e)
	}
}