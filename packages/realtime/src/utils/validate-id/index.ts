/**
 * @function validateId
 * @description validate if the id follows the constraints
 * @param {string} id - id to validate
 * @returns {boolean}
 */
export function validateId(id: string): boolean {
  const lengthConstraint = /^.{2,64}$/;
  const pattern = /^[-_&@+=,(){}\[\]\/«».|'"#a-zA-Z0-9À-ÿ\s]*$/;

  if (!lengthConstraint.test(id)) {
    return false;
  }

  if (!pattern.test(id)) {
    return false;
  }

  return true;
}
