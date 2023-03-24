var isFeatureFlagTrue = (value) => String(value).toLocaleLowerCase() === 'true';

module.exports = { isFeatureFlagTrue };