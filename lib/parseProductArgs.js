function parseProductArgs(args) {
  const hashIndex = args.indexOf("#");
  if (hashIndex === -1) {
    return null;
  }

  const productName = args.slice(0, hashIndex).trim();
  const description = args.slice(hashIndex + 1).trim();

  return { productName, description };
}

module.exports = parseProductArgs;
