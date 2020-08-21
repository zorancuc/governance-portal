import governancePlugin from '@makerdao/dai-plugin-governance';
import trezorPlugin from '@makerdao/dai-plugin-trezor-web';
import ledgerPlugin from '@makerdao/dai-plugin-ledger-web';
import Maker, { ETH, MKR } from '@makerdao/dai';
import configPlugin from '@makerdao/dai-plugin-config';
import { createCurrency } from '@makerdao/currency';

import { netToUri } from '../utils/ethereum';
import { ko } from 'ethers/wordlists';

export default async function createMaker(
  network = 'mainnet',
  useMcdKovanContracts,
  testchainConfigId,
  backendEnv
) {
  const config = {
    plugins: [trezorPlugin, ledgerPlugin, [governancePlugin, { network }]],
    autoAuthenticate: true,
    log: false,
    provider: {
      url: testchainConfigId ? '' : netToUri(network),
      type: 'HTTP'
    }
  };

  const MKR = createCurrency('MKR');
  const IOU = createCurrency('IOU');
  const kovanMcdAddresses = require('./addresses/kovan-mcd.json');
  const mainMcdAddresses = require('./addresses/main-mcd.json');

  const addContracts = Object.keys(kovanMcdAddresses).reduce((result, key) => {
    result[key] = {
      address: { kovan: kovanMcdAddresses[key], mainnet: mainMcdAddresses[key] }
    };
    return result;
  }, {});

  const kovanToken = {
    erc20: [
      {
        currency: MKR,
        symbol: MKR.symbol,
        address: kovanMcdAddresses.GOV
      },
      {
        currency: IOU,
        symbol: IOU.symbol,
        address: kovanMcdAddresses.IOU
      }
    ]
  };

  const mainToken = {
    erc20: [
      {
        currency: MKR,
        symbol: MKR.symbol,
        address: mainMcdAddresses.GOV
      },
      {
        currency: IOU,
        symbol: IOU.symbol,
        address: mainMcdAddresses.IOU
      }
    ]
  };

  config.smartContract = { addContracts };
  if (network == 'kovan') config.token = kovanToken;
  else if (network == 'mainnet') config.token = mainToken;

  // Use the config plugin, if we have a testchainConfigId
  if (testchainConfigId) {
    delete config.provider;
    config.plugins.push([
      configPlugin,
      { testchainId: testchainConfigId, backendEnv }
    ]);
  }

  return Maker.create('http', config);
}

export { ETH, MKR };
