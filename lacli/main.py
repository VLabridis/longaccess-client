"""
Usage: lacli [--help] [-u <user>] [-p <pass>] [--verbose]
             [--home <home>] [--debug <level>] [--batch]
             <command> [<args>...]
       lacli -i

Commands (run lacli <command> -h for options):

    archive         manage archives
    capsule         manage capsules
    certificate     manage certificates
    login           configure access credentials

Options:
    -i, --interactive              interactive mode
    -u <user>, --user <user>       user name
    -p <pass>, --password <pass>   user password
    -d <level>, --debug <level>    debug level, from 0 to 2 [default: 0]
    --home <home>                  conf/cache dir [default: ~/.longaccess]
    -v, --verbose                  print verbose information
    --batch                        be brief, don't ask questions
    -h, --help                     print this help
"""

import sys
import os
import cmd

from lacli.log import setupLogging
from docopt import docopt, DocoptExit
from lacli.command import LaCapsuleCommand, LaCertsCommand, LaArchiveCommand
from lacli.login import LaLoginCommand
from lacli import __version__
from lacli.api import Api
from lacli.cache import Cache


def settings(options):
    debug = 0

    try:
        debug = int(options['--debug'])
    except ValueError:
        print "error: illegal value for 'debug' parameter."
        raise

    verify = True
    if '0' == os.getenv('LA_API_VERIFY'):
        verify = False

    batch = options['--batch']
    if not batch and os.getenv('LA_BATCH_OPERATION'):
        batch = True

    prefs = {
        'api': {
            'user': options['--user'],
            'pass': options['--password'],
            'url': os.getenv('LA_API_URL'),
            'verify': verify
        },
        'command': {
            'debug': debug,
            'verbose': options['--verbose'],
            'batch': options['--batch']
        },
    }
    if options['<command>']:
        prefs[options['<command>']] = options['<args>']
    return (prefs, Cache(os.path.expanduser(options['--home'])))


class LaCommand(cmd.Cmd):
    prompt = 'lacli> '
    archive = None
    capsule = None
    certificate = None

    def __init__(self, session, cache, prefs):
        cmd.Cmd.__init__(self)
        setupLogging(prefs['command']['debug'])
        self.archive = LaArchiveCommand(session, cache, prefs)
        self.capsule = LaCapsuleCommand(session, cache, prefs)
        self.certificate = LaCertsCommand(session, cache, prefs)
        self.login = LaLoginCommand(session, cache, prefs)

    def do_EOF(self, line):
        print
        return True

    def dispatch(self, subcmd, options):
        options.insert(0, subcmd)
        try:
            subcmd = getattr(self, subcmd)
            line = subcmd.makecmd(docopt(subcmd.__doc__, options))
            self.dispatch_one(subcmd, line)
        except AttributeError:
            print "Unrecognized command:", subcmd
            print(__doc__)
        except DocoptExit as e:
            print e
            return

    def dispatch_one(self, subcmd, line, interactive=False):
        if line:
            subcmd.onecmd(line)
        elif interactive:
            subcmd.cmdloop()

    def do_archive(self, line):
        self.dispatch_one(self.archive, line, True)

    def do_capsule(self, line):
        self.dispatch_one(self.capsule, line, True)

    def do_certificate(self, line):
        self.dispatch_one(self.certificate, line, True)

    def do_login(self, line):
        self.login.onecmd('login ' + line)


def main(args=sys.argv[1:]):
    """Main function called by `laput` command.
    """
    options = docopt(__doc__,
                     version='lacli {}'.format(__version__),
                     options_first=True)
    prefs, cache = settings(options)
    api = Api(prefs['api'])
    cli = LaCommand(api, cache, prefs)
    if options['<command>']:
        cli.dispatch(options['<command>'], options['<args>'])
    elif options['--interactive']:
        cli.cmdloop()

if __name__ == "__main__":
    main()
