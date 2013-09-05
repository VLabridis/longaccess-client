from behave_cli.api.robohydra import RoboHydra
from behave import step


@step(u'the API is failing')
def api_failing(context):
    context.mock_api.test('serverProblems')


@step(u'the mock API "{name}"')
def robohydra_api(context, name):
    context.mock_api = RoboHydra(name=name)
    for step in context.feature.parser.parse_steps(
            u"Then RoboHydra asserts do not fail"):
        context.scenario.steps.append(step)
        for formatter in context._runner.formatters:
            formatter.step(step)
            formatter.indentations.append(0)


@step(u'RoboHydra asserts do not fail')
def robohydra_asserts(context):
    rs = context.mock_api.results()
    for plugin, tests in rs.items():
        for test, test_results in tests.items():
            failures = test_results["failures"]
            assert len(failures) == 0, "test {} has failed".format(test)
