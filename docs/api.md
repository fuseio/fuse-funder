<a name="top"></a>
# fuse-funder v0.2.0

Fuse Funder API. Base url: https://funder-qa.fuse.io/api

- [Bonus](#Bonus)
	- [Fetch token funding status](#Fetch-token-funding-status)
	- [Bonus account with token](#Bonus-account-with-token)
	
- [Funding](#Funding)
	- [Fund account with native](#Fund-account-with-native)
	- [Fetch native funding status](#Fetch-native-funding-status)
	- [Fetch token funding status](#Fetch-token-funding-status)
	- [Fund account with token](#Fund-account-with-token)
	- [Fetch native balance](#Fetch-native-balance)
	- [Fetch token balance](#Fetch-token-balance)
	
- [Job](#Job)
	- [Fetch job by id](#Fetch-job-by-id)
	

# <a name='Bonus'></a> Bonus

## <a name='Fetch-token-funding-status'></a> Fetch token funding status
[Back to top](#top)



```
GET /bonus/status/:id
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Token bonus id</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| status | `String` | <p>Token bonus status, can be STARTED, SUCCEEDED or FAILED.</p> |
## <a name='Bonus-account-with-token'></a> Bonus account with token
[Back to top](#top)



```
POST /bonus/token
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| phoneNumber | `String` | <p>Phone number of bonus receiver</p> |
| accountAddress | `String` | <p>Account address to give bonus</p> |
| tokenAddress | `String` | <p>Token address of the token to give as bonus</p> |
| bonusInfo | `Object` | <p>The reason for the bonus</p> |
| originNetwork | `Object` | <p>ropsten/mainnet</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Task id of the bonus job</p> |
| status | `String` | <p>Current status of the job. Should be &quot;STARTED&quot; if all good.</p> |
# <a name='Funding'></a> Funding

## <a name='Fund-account-with-native'></a> Fund account with native
[Back to top](#top)



```
POST /fund/native
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| accountAddress | `String` | <p>Account address to fund</p> |
| tokenAddress | `String` | <p>Token address to determine the bonus amount (optional)</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Task id of the funding job</p> |
| status | `String` | <p>Current status of the job. Should be &quot;STARTED&quot; if all good.</p> |
## <a name='Fetch-native-funding-status'></a> Fetch native funding status
[Back to top](#top)



```
GET /fund/status/:id
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Native funding id</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| status | `String` | <p>Native funding status, can be STARTED, SUCCEEDED or FAILED.</p> |
## <a name='Fetch-token-funding-status'></a> Fetch token funding status
[Back to top](#top)



```
GET /fund/status/:id
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Token funding id</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| status | `String` | <p>Token funding status, can be STARTED, SUCCEEDED or FAILED.</p> |
## <a name='Fund-account-with-token'></a> Fund account with token
[Back to top](#top)



```
POST /fund/token
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| phoneNumbber | `String` | <p>Phone number of bonus receiver</p> |
| accountAddress | `String` | <p>Account address to fund</p> |
| tokenAddress | `String` | <p>Token address of the funding token</p> |
| originNetwork | `Object` | <p>ropsten/mainnet</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Task id of the funding job</p> |
| status | `String` | <p>Current status of the job. Should be &quot;STARTED&quot; if all good.</p> |
## <a name='Fetch-native-balance'></a> Fetch native balance
[Back to top](#top)



```
GET /balance/native/:accountAddress
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| accountAddress | `String` | <p>Account address</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| balance | `String` | <p>Native balance</p> |
## <a name='Fetch-token-balance'></a> Fetch token balance
[Back to top](#top)



```
GET /balance/token/:accountAddress/:tokenAddress
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| accountAddress | `String` | <p>Account address</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| balance | `String` | <p>Token balance</p> |
# <a name='Job'></a> Job

## <a name='Fetch-job-by-id'></a> Fetch job by id
[Back to top](#top)



```
GET /job/:id
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Job id</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| data | `Object` | <p>Job object</p> |
