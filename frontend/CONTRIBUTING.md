# Code Style Guide

## TypeScript

### Prefer `type` over `interface`

`type` can express everything that `interface` can, but also type aliases, unions and more. 
Use `type` for better consistency.

### Avoid `default export`

`default export` has worse IDE support for auto-imports, worse refactoring experience.

## React

### Example component definition

```ts
type Props = {
    // ...
}

export const Dashboard: FC<Props> = (props) => {
    // ...
}
```

Note:

- `FC` instead of `React.FC`
- `export`
- props type name can be left as `Props` if it's used only in single file
- `Props` is not exported, if there is no need 

### Aim for smaller file sizes

As a rule of thumb, each file should be no more than 500 loc.