import {
  PublicKeyCredentialCreationOptionsJSON,
  AttestationCredential,
  AttestationCredentialJSON,
} from '@simplewebauthn/typescript-types';

import toUint8Array from '../helpers/toUint8Array';
import toBase64String from '../helpers/toBase64String';
import supportsWebauthn from '../helpers/supportsWebauthn';
import toPublicKeyCredentialDescriptor from '../helpers/toPublicKeyCredentialDescriptor';

/**
 * Begin authenticator "registration" via WebAuthn attestation
 *
 * @param creationOptionsJSON Output from @simplewebauthn/server's generateAttestationOptions(...)
 */
export default async function startAttestation(
  creationOptionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<AttestationCredentialJSON> {
  if (!supportsWebauthn()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // We need to convert some values to Uint8Arrays before passing the credentials to the navigator
  const publicKey: PublicKeyCredentialCreationOptions = {
    ...creationOptionsJSON,
    challenge: toUint8Array(creationOptionsJSON.challenge),
    user: {
      ...creationOptionsJSON.user,
      id: toUint8Array(creationOptionsJSON.user.id),
    },
    excludeCredentials: creationOptionsJSON.excludeCredentials.map(
      toPublicKeyCredentialDescriptor,
    ),
  };

  // Wait for the user to complete attestation
  const credential = await navigator.credentials.create({ publicKey }) as AttestationCredential;

  if (!credential) {
    throw new Error('Attestation was not completed');
  }

  const { rawId, response } = credential;

  // Convert values to base64 to make it easier to send back to the server
  return {
    ...credential,
    rawId: toBase64String(rawId),
    response: {
      ...response,
      attestationObject: toBase64String(response.attestationObject),
      clientDataJSON: toBase64String(response.clientDataJSON),
    }
  };
}
