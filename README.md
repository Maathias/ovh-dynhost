# ovh-dynhost
## config/
### config.json
```json
{
	"mode": "single", // single, interval
	"source": "file", // arguments, file
	"interval": 300, // in seconds
	"ip": "0.0.0.0" // last ip (saved automatically)
}
```
### domains.json
```json
{
	"your.domain": {
		"user": "username", // without the domain prefix
		"pass": "password"
	},
	[...]
}
```

## Usage
`node index.js hostname username password <interval>`

If interval is specified, mode is set to interval, otherwise it overrides the config and runs in single mode.

Values from config are only used when no arguments are given. By default single mode is used and values are taken from `domains.json` file

## logs/
### full.log
Stores full output from console
```
30/11/2019 19:40:11 # config.json doesn't exist, creating from default
30/11/2019 19:40:11 # Loaded config.json
30/11/2019 19:40:11 # Source: file
30/11/2019 19:40:11 # File domains.json doesn't exist
30/11/2019 19:40:56 # Loaded config.json
30/11/2019 19:40:56 # Source: file
30/11/2019 19:40:56 # Mode: single
30/11/2019 19:40:56 # Getting new address
30/11/2019 19:40:57 # New address: 0.0.0.0
30/11/2019 19:40:57 # Sending new address for "your.domain"
30/11/2019 19:40:59 # your.domain: address sent: good
```
### short.log
Stores short output only for new addresses
```
Sat Nov 30 2019 19:56:20 GMT+0100 (Central European Standard Time) 83.30.207.133
  your.domain: 200 good
  [...]
```