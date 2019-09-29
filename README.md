# FUSE funder

Funder is responsible to fund user transactions on the Fuse chain, and send various token bonuses like join community bonus to the community members.

The funding is done in query like manner via the [agendajs](http://agendajs.com/) framework. That means there's two steps to receive a funding:
- Send a funding request and get a job id.
- Track the job status via the job status API.

Look into the [API](./docs/api.md) for more info.