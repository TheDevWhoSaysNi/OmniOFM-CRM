# Team access

| Person | GitHub | Discord Dev Team | OmniOFM CRM repo |
|--------|--------|------------------|------------------|
| Ryan | TheDevWhoSaysNi | Yes | Owner |
| Umer | `umer` | Yes | Collaborator invite sent |
| Owais | `owaischanna` | Yes | Collaborator invite sent |
| Mark | _pending GitHub username_ | Yes | Add when username confirmed |

Cloudflare Access steps: [cloudflare-access.md](cloudflare-access.md)

Grant Mark repo access with:

```bash
gh api repos/TheDevWhoSaysNi/OmniOFM-CRM/collaborators/<github-username> -X PUT -f permission=push
```