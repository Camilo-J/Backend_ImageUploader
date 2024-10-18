import { App, Stack } from "aws-cdk-lib";
import { BaseStack } from "../lib/stacks/base-stack";
import { Template } from "aws-cdk-lib/assertions";

test("Base Stack", () => {
  const stack = new Stack();

  new BaseStack(stack, "TestBaseStack");

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test("Test bucket and its permission", () => {
  const stack = new Stack();

  const baseStack = new BaseStack(stack, "TestBaseStack");

  expect(baseStack.bucket.bucketName).toBeDefined();
  expect(baseStack.bucket.policy).toBeDefined();
});

test("Test cloudfront distribution", () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");

  const baseStack = new BaseStack(stack, "TestBaseStack");

  expect(baseStack.cloudfrontUrl).toBeDefined();
});

test("Test api gateway", () => {
  const stack = new Stack();

  const baseStack = new BaseStack(stack, "TestBaseStack");

  expect(baseStack.apiEndpoint.url).toBeDefined();
  expect(baseStack.apiEndpoint.restApiName).toContain("image-uploader-api-dev");
});
