# Schema Tool

## Scopo 

Validare lo schema corretto contro il payload in azione, così da garatnire il principio di schema-first.

---

### Funzioni

- **`schema_get(ctx, schema_id)`**  
  Ritorna lo schema JSON associato.

- **`schema_validate(ctx, schema_id, payload)`**  
  Valida payload contro schema JSON.