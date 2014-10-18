```
                       ██╗███████╗██████╗ ██████╗ ██╗   ██╗
                       ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝
                       ██║█████╗  ██████╔╝██████╔╝ ╚████╔╝
                  ██   ██║██╔══╝  ██╔══██╗██╔══██╗  ╚██╔╝
                  ╚█████╔╝███████╗██║  ██║██║  ██║   ██║
                   ╚════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

            Your friendly helper to the world of gitflow on jira!
```

*DISCLAIMER:* Jerry is a small command-line tool used to aid my day-to-day workflow using jira
and github. I'm not sure how useful it will be for anyone else not working the same way.

## Installation

Clone this repo locally:

    git clone https://github.com/robhurring/jerry.git

Install dependencies:

    `npm install`

Install the package:

    `npm link`

Configuring:

    Run the command `jerry` to run the setup wizard.

  A few things to note:

  * This uses Jira's OnDemand login since I do not have an oauth application setup.
  * If GitHub is giving you validation issues, make sure to go into [application settings](https://github.com/settings/applications) and remove and old `Jerry CLI` tokens.
  * This makes a _lot_ of assumptions. You can edit some of these in the `~/.jerry.json` config file after running the setup wizard.
  * If you ask jerry about tickets without the project prefix he will prefix the `config.defaultProject` in front of it before looking it up.

## Commands

#### Branch (alias: br)

The branch command will take a TICKET_ID param and create a named branch for you in your current repo.

###### Example

```
$ jerry branch PL-4
$ Switched to branch PL-4_some_truncated_ticket_summary_here
```

**NOTE:** Jerry will also scan your existing local branches to see if there is already a branch made starting with the ticket `pl-4` (case insensitive). If it finds something matching the given ticket, it will check out the existing branch rather than creating a new one. This should avoid some annoying collision issues.

#### Info (alias: in)

Print some basic information about a given ticket. If not ticket is passed in through the args list jerry will check your current branch and extract the ticket from there.

###### Example

```
$ jerry info pl-4

PL-4: Some ticket title here.
https://company.atlassian.net/browse/PL-4

Creator: Rob Hurring
Assigned: Nobody
Code Reviewer: Nobody

Status: New

Hey developer, theres awful bugs all over. Fix them, then go get some
ice cream or something
```

Or if you are in a git repo and on a feature branch

```
$ git checkout -b PL-4_some_feature_branch
$ jerry info

PL-4: Some ticket title here.
https://company.atlassian.net/browse/PL-4

Creator: Rob Hurring
Assigned: Nobody
Code Reviewer: Nobody

Status: New

Hey developer, theres awful bugs all over. Fix them, then go get some
ice cream or something
```

#### Pull-Request (alias: pr)

If you are on a feature branch Jerry can help you open a fleshed-out pull-request. If you are the lazy-type, this is really the best feature.

Jerry will detect the ticket from your branch name, lookup some basic details about the ticket from Jira and use that info to build out a pull-request. If all goes well, it will open a browser window to your new PR so you can do some adjustments.

###### Options

* **--into=BRANCH** This will set the base of the pull-request to `BRANCH`. It will be your `config.defaultBranch` otherwise

###### Example

```
$ git checkout -b PL-4_some_feature_branch
$ jerry pull-request

PL-4: Some awesome feature request here
https://github.com/user/repo/pulls/1
```

*NOTE:* This is still a work-in-progress and is a little bit flaky right now.

#### Open (alias: o)

Open the given ticket in the browser. Jerry will extract the ticket ID from the feature branch if possible and no ID was given in the args.

```
$ jerry open pl-4
http://company.atlassian.net/browse/PL-4
```

#### Copy (alias: cp)

Copy the given ticket to the clipboard. Jerry will extract the ticket ID from the feature branch if possible and no ID was given in the args.

```
$ jerry cp pl-4
Copied! http://company.atlassian.net/browse/PL-4
```

## Contributing

1. Fork it ( https://github.com/[my-github-username]/git-jira/fork )
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

