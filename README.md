# Backup Cleaner

This is simple app in NodeJS which removing all files older than 7 days from selected bucket on S3 and
creating backups based on configuration stored in `backups.json`.

## Libs used:
- AWS SDK (S3 Client)
- Day.js
- TypeScript

## Usage:
```
ts-node index.ts
```

### Backups configuration

Configuration of backups which should be made are stored in `backups.json` file. In this file we declare obj which have `backups` key and it value is an array with
objects. Each object should fullfill requirements from `BackupItem` type declared in `types.js`.

### Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

### Security

If you discover any security related issues, please email mateusz.gostanski [at] gmail.com instead of using the issue tracker.

## Credits

- [Mateusz Gostański](https://github.com/grixu)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.