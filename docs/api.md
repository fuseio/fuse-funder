<a name="top"></a>
# fuse-funder v0.2.0

Fuse Funder API. Base url: https://funder-qa.fusenet.io/api

- [Funding](#Funding)
	- [Fund account with native](#Fund-account-with-native)
	- [Fetch native funding status](#Fetch-native-funding-status)
	- [Fetch token funding status](#Fetch-token-funding-status)
	- [Fund account with token](#Fund-account-with-token)
	- [Fetch native balance](#Fetch-native-balance)
	- [Fetch token balance](#Fetch-token-balance)
	

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
| status | `String` | <p>Current Status of the job.</p> |
## <a name='Fetch-native-funding-status'></a> Fetch native funding status
[Back to top](#top)

<p>Possible statuses are: STARTED, SUCCEEDED or FAILED</p>

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
| status | `String` | <p>Native funding status</p> |
## <a name='Fetch-token-funding-status'></a> Fetch token funding status
[Back to top](#top)

<p>Possible statuses are: STARTED, SUCCEEDED or FAILED</p>

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
| status | `String` | <p>Token funding status</p> |
## <a name='Fund-account-with-token'></a> Fund account with token
[Back to top](#top)



```
POST /fund/token
```

### Parameter Parameters
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| accountAddress | `String` | <p>Account address to fund</p> |
| tokenAddress | `String` | <p>Token address of the funding token</p> |


### Success 200
| Name     | Type       | Description                           |
|:---------|:-----------|:--------------------------------------|
| id | `String` | <p>Task id of the funding job</p> |
| status | `String` | <p>Current Status of the job</p> |
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
