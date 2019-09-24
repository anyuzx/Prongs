---
title: "How to Access iPython Notebook On A Remote Server ?"
date: 2017-02-18
excerpt: "Ever wondering how to run a ipython notebook on a remote machine? Here is how to do it in a simple way. My research work involves a lot of using of IPython Notebook. I usually do it on an office MAC. However I also very often need to access it from home. After a brief searching, I found these three wonderful articles on this topic"
categories:
  - code
tags:
  - python
disableKatex: true
---

My research work involves a lot of using of IPython Notebook. I usually do it on an office MAC. However I also very often need to access it from home. After a brief searching, I found these three wonderful articles on this topic.

* [Remote hosting of IPython Notebooks](http://www.hydro.washington.edu/~jhamman/hydro-logic/blog/2013/10/04/pybook-remote/)
* [Accessing IPython Notebook remotely over an SSH tunnel](http://wisdomthroughknowledge.blogspot.com/2012/07/accessing-ipython-notebook-remotely.html)
* [Remote Access to IPython Notebooks via SSH](https://coderwall.com/p/ohk6cg/remote-access-to-ipython-notebooks-via-ssh)

I have been doing this for a while. But it eventually comes to me that how good it is if I can make it automatic. So I wrote this python script to do the procedures described in those three articles. I am sure there must be some more elegant way to do this. But this is what I got so far and it works.

```python
import paramiko
import sys
import subprocess
import socket
import argparse

# function to get available port
def get_free_port():
      s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
      s.bind(('localhost',0))
      s.listen(1)
      port = s.getsockname()[1]
      s.close()
      return port

# print out the output from paramiko SSH connection
def print_output(output):
    for line in output:
        print(line)

parser = argparse.ArgumentParser(description='Locally open IPython Notebook on remote server\n')
parser.add_argument('-t', '--terminate', dest='terminate', action='store_true', \
                    help='terminate the IPython notebook on remote server')
args = parser.parse_args()

host="***" # host name
user="***" # username

# write a temporary python script to upload to server to execute
# this python script will get available port number

def temp():
    with open('free_port_tmp.py', 'w') as f:
        f.write('import socket\nimport sys\n')
        f.write('def get_free_port():\n')
        f.write('    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n')
        f.write("    s.bind(('localhost', 0))\n")
        f.write('    s.listen(1)\n')
        f.write('    port = s.getsockname()[1]\n')
        f.write('    s.close()\n')
        f.write('    return port\n')
        f.write("sys.stdout.write('{}'.format(get_free_port()))\n")
        f.write('sys.stdout.flush()\n')

def connect():
    # create SSH client
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.load_system_host_keys()
    client.connect(host, username=user)

    # generate the temp file and upload to server
    temp()
    ftpClient = client.open_sftp()
    ftpClient.put('free_port_tmp.py', "/tmp/free_port_tmp.py")

    # execute python script on remote server to get available port id
    stdin, stdout, stderr = client.exec_command("python /tmp/free_port_tmp.py")
    stderr_lines = stderr.readlines()
    print_output(stderr_lines)

    port_remote = int(stdout.readlines()[0])
    print('REMOTE IPYTHON NOTEBOOK FORWARDING PORT: {}\n'.format(port_remote))

    ipython_remote_command = "source ~/.zshrc;tmux \
                              new-session -d -s remote_ipython_session 'ipython notebook \
                              --no-browser --port={}'".format(port_remote)

    stdin, stdout, stderr = client.exec_command(ipython_remote_command)
    stderr_lines = stderr.readlines()

    if len(stderr_lines) != 0:
        if 'duplicate session: remote_ipython_session' in stderr_lines[0]:
            print("ERROR: \"duplicate session: remote_ipython_session already exists\"\n")
            sys.exit(0)

    print_output(stderr_lines)

    # delete the temp files on local machine and server
    subprocess.run('rm -rf free_port_tmp.py', shell=True)
    client.exec_command('rm -rf /tmp/free_port_tmp.py')

    client.close()

    port_local = int(get_free_port())
    print('LOCAL SSH TUNNELING PORT: {}\n'.format(port_local))

    ipython_local_command = "ssh -N -f -L localhost:{}:localhost:{} \
                            gs27722@wel-145-31.cm.utexas.edu".format(port_local, port_remote)

    subprocess.run(ipython_local_command, shell=True)


def close():
    # create SSH client
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.load_system_host_keys()
    client.connect(host, username=user)
    stdin, stdout, stderr = client.exec_command("source ~/.zshrc;tmux kill-session -t remote_ipython_session")
    stderr_lines = stderr.readlines()
    if len(stderr_lines) == 0:
        print('Successfully terminate the IPython notebook\n')
    else:
        print_output(stderr_lines)
    client.close()

if args.terminate:
    close()
else:
    connect()
```

This script does the following:
1. Connect to the server using python package [**paramiko**](http://www.paramiko.org).
2. Upload a temporary python script. Use `paramiko` to execute the python script. This script gets an available port on localhost.
3. Open Ipython Notebook using the port we get from the last step. I used [**tmux**](https://tmux.github.io) to do this. And my shell is `zsh`. You can modify that part of code based on your situation
4. On the local machine, find an available port and create an SSH tunneling to port forwarding the port on the remote machine to local machine.

If the script runs successfully, you will see something like this.

![Run the script](https://i.imgur.com/OoFQ3zg.png)

If you want to check does IPython Notebook really runs on the remote machine. Use command `tmux ls`. A tmux session named `remote_ipython_session` should exist.

![Check the status](https://i.imgur.com/anufLcg.png)

In browser, open `http://localhost: 50979`. You should be able to access your ipython notebook. To terminate the ipython notebook on the remote machines, simply do

![Terminate the tunneling](https://i.imgur.com/EOfdo8h.png)
