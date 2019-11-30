# ovh-dynhost
## config/
### config.json
```json
{
	"mode": "single",
	"source": "file",
	"interval": 300,
	"logs": "both",
	"rotation": 1e6,
	"ip": "0.0.0.0"
}
```
mode: `single` or `interval`

source: `arguments` or `file`

interval: in seconds

logs: `no`, `short`, `full` or `both`

rotation: max number of bytes for log files, before rotation

ip: last address, updated automatically
### domains.json
```json
{
	"your.domain": {
		"user": "username",
		"pass": "password"
	},
}
```

## Usage
`node index.js hostname username password <interval>`

If interval is specified, mode is set to interval, otherwise it overrides the config and runs in single mode. Set to `default` to use value from config.

 By default single mode is used and values are taken from `domains.json` file.

## logs/
### full.log
Stores full output from console
```
30/11/2019 21:17:09 # Loaded config.json
30/11/2019 21:17:09 # single | file
30/11/2019 21:17:09 # Getting new address
30/11/2019 21:17:13 # New address: 0.0.0.0
30/11/2019 21:17:13 # Sending new address for "your.domain"
30/11/2019 21:17:14 # your.domain: address sent: good
```
### short.log
Stores short output only for new addresses
```
Sat Nov 30 2019 19:56:20 GMT+0100 (Central European Standard Time) Failed to get address
Sat Nov 30 2019 19:56:20 GMT+0100 (Central European Standard Time) 83.30.207.133
  your.domain: 200 good
  [...]
```