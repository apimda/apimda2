#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { HelloWorldStack } from './stack.js';

const app = new cdk.App();
new HelloWorldStack(app, 'HelloWorldStack', {});
