import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { MwCatalogueStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new MwCatalogueStack(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});