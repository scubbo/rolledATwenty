import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as RolledATwenty from '../lib/rolled_a_twenty-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new RolledATwenty.RolledATwentyStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT));
});
