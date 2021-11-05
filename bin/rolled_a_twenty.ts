#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RolledATwentyStack } from '../lib/rolled_a_twenty-stack';

const app = new cdk.App();
new RolledATwentyStack(app, 'RolledATwentyStack');
