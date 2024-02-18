export const getResourceName = (name: string) => {
  const environment = process.env.ENVIRONMENT || "dev";

  if (environment === "prod" || !environment) {
    return name;
  }

  return `${name}-${process.env.ENVIRONMENT || "dev"}`;
};
