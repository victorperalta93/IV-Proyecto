#!/usr/bin/env sh

wget http://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz
tar -xzf install-tl-unx.tar.gz
cd install-tl-unx
./install-tl --profile=../texlive.profile