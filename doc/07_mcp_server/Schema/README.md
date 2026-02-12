# Schema Tool

## Scopo 

Validare il payload in azione contro lo schema, così da garantire il principio di schema-first.

---

### Funzioni

- **`schema_get(ctx, schema_id)`**  
  Ritorna lo schema JSON associato.

- **`schema_validate(ctx, schema_id, payload)`**  
  Valida payload contro schema JSON.