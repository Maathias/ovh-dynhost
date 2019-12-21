const https = require('https'),
	fs = require('fs'),
	log = require('pretty-log')

log.templates.warn = '$yellow'
log.templates.secondary = '$clear: $secondary'
log.templates.clear = '$clear'
log.values.yellow = 'chalk.yellow(data.data)'
log.values.secondary = 'chalk.red(data.secondary)'
log.values.mode = 'chalk.red(data.mode)'
log.values.clear = 'data.data'

function newIp() {
	return new Promise((resolve, reject) => {
		log.log({ action: 'clear', data: `Getting new address` })
		https.request({
			hostname: 'api.ipify.org',
			port: 443,
			path: '/?format=json',
			method: 'GET'
		}, res => {
			res.on('data', d => {
				let ip = JSON.parse(d).ip
				// let ip = d.toString().replace(/\r?\n|\r/g, '')
				log.log({ action: 'secondary', data: `New address`, secondary: ip })
				resolve({ status: res.statusCode, response: ip })
			})
		}).on('error', e => {
			log.log({ action: 'warn', data: `Failed to get address`})
			reject(e)
		}).end()
	})
}

function setIp(hostname, ip, auth) {
	return new Promise((resolve, reject) => {
		log.log({ action: 'clear', data: `Sending new address for "${hostname}"` })
		https.request({
			hostname: 'www.ovh.com',
			port: 443,
			path: `/nic/update?system=dyndns&hostname=${hostname}&myip=${ip}`,
			method: 'GET',
			headers: {
				'Authorization': 'Basic ' + Buffer.from(`${hostname}-${auth.user}:${auth.pass}`).toString('base64')
			}
		}, res => {
			res.on('data', d => {
				let out = d.toString().replace(/\r?\n|\r/g, ''),
					short = out.split(' ')[0]
				switch (res.statusCode) {
					default: log.log({ action: 'warn', data: `${hostname}: request failed: ${out}` })
						break; case 200: log.log({ action: 'secondary', data: `${hostname}: address sent`, secondary: short })
						break; case 401: log.log({ action: 'warn', data: `${hostname}: request authorization failed` })
				}

				resolve({ hostname: hostname, status: res.statusCode, response: out, code: short })
			})
		}).on('error', e => reject(e)).end()
	})
}

function getJson(path) {
	return JSON.parse(fs.readFileSync(path))
}

function setJson(path, content) {
	let dir = path.split('/').slice(0, -1).join('/')
	if (!fs.existsSync(dir)) fs.mkdirSync(dir)
	return fs.writeFileSync(path, JSON.stringify(content))
}

function combo(domains) {
	newIp().then(d => {
		result = {}
		promises = []
		for (let hostname in domains) {
			if (config.ip == d.response) {
				log.log({ action: 'clear', data: `Address unchanged` })
				break
			}
			promises.push(setIp(hostname, d.response, domains[hostname]))
		}
		Promise.all(promises).then(data => {
			updateLog(d.response, data)
			if (config.mode == 'interval') {
				setTimeout(() => combo(domains), config.interval * 1000)
			}
		})
		config.ip = d.response
		setJson('./config/config.json', config)
	}).catch(e => {
		if (config.mode == 'interval') {
			setTimeout(() => combo(domains), config.interval * 1000)
		}
		if (config.ip == false) {
			log.log({ action: 'clear', data: `Address unchanged` })
			return
		}
		config.ip = false
		updateLog(null, null, false)
		setJson('./config/config.json', config)
	})
}

function updateLog(ip, domains, ok) {
	if(ok == false){
		fs.appendFileSync('./logs/short.log', `${new Date} Failed to get ip\n`);
		return
	}
	if (domains.length == 0) return
	list = ""
	for (let domain of domains) {
		list += `  ${domain.hostname}: ${domain.status} ${domain.code}\n`
	}
	if ((config.log || 'both') == 'short' || (config.log || 'both') == 'both')
		fs.appendFileSync('./logs/short.log', `${new Date} ${ip}\n${list}`);

	if (fs.statSync("./logs/short.log").size > (config.rotation || 1e6)) {
		fs.rename("./logs/short.log", `./logs/short+.log`, function (err) {
			if (err) log.log({ action: 'warn', data: `Error rotating log file` })
		});
	}
}

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs')

if (!fs.existsSync('./config/config.json')) {
	log.log({ action: 'warn', data: `config.json doesn't exist, creating from default` })
	setJson('./config/config.json', {
		mode: 'single',
		source: 'file'
	})
}

const config = getJson('./config/config.json')

log.after = function (data) {
	if ((config.log || 'both') == 'full' || (config.log || 'both') == 'both') {
		fs.appendFileSync('./logs/full.log', data + '\n');
		if (fs.statSync("./logs/full.log").size > (config.rotation || 1e6)) {
			fs.rename("./logs/full.log", `./logs/full+.log`, function (err) {
				if (err) log.log({ action: 'warn', data: `Error rotating log file` })
			});
		}
	}
}

log.log({ action: 'info', data: `Loaded config.json` })

let domains = {}

if ((config.mode != 'single') && (config.mode != 'interval')) {
	log.log({ action: 'warn', data: `Invalid mode` })
	process.exit(1)
}
if ((config.source != 'arguments') && (config.source != 'file')) {
	log.log({ action: 'warn', data: `Invalid source` })
	process.exit(1)
}

log.log({ action: 'info', data: `${config.mode} | ${config.source}`})

if (config.source == 'arguments') {
	if (process.argv.length < 5) {
		log.log({ action: 'warn', data: `Invalid arguments` })
		process.exit(1)
	}
	domains[process.argv[2]] = {
		user: process.argv[3],
		pass: process.argv[4]
	}

	if (typeof process.argv[5] != 'undefined') {
		if (process.argv[5] != 'default')
			config.interval = parseInt(process.argv[5])
		else config.interval = 300
		config.mode = 'interval'
	} else {
		config.mode = 'single'
	}
} else if (config.source == 'file') {
	if (!fs.existsSync('./config/domains.json')) {
		log.log({ action: 'warn', data: `File domains.json doesn\'t exist` })
		process.exit(1)
	}
	domains = getJson('./config/domains.json')
}

if (config.mode == 'interval') {
	if (typeof config.interval == 'undefined') {
		log.log({ action: 'warn', data: `Interval not specified, setting to default` })
		config.interval = 300
	}
	log.log({ action: 'clear', data: `Interval ${config.interval}s` })
}
combo(domains)