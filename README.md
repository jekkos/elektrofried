
A simple starting point for writing 2d games. See tutorial.md for more information.

Installation
------------
You will need to install Node 0.8, which is not by default on the standard debian repositories.

    sudo apt-get update
    sudo apt-get install -y python-software-properties python g++ make
    sudo apt-get-repository -y ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs

Secondly, to make camelot.js work, you will need to clone and compile fswebcam. In order to make it compile, 
you will need to install the gd image library first.

    sudo apt-get install libgd2-xpm-dev

If this succeeds, you can clone and build fswebcam

    git clone https://github.com/fsphil/fswebcam.git
    cd fswebcam
    ./configure
    make
    make install

When fswebcam does not detect any webcam, then check if the drivers are installed properly. I found a LifeCam NX-3000 (UVC-compliant), 
which needed to load some [extra firmware](https://lists.ubuntu.com/archives/kernel-bugs/2010-July/128364.html) first.

    sudo apt-get install libglib2.0-dev libusb-dev build-essential gcc automake mercurial
    hg clone http://bitbucket.org/ahixon/r5u87x/
    cd r5u87x
    make
    sudo make install
    sudo r5u87x-loader --reload

