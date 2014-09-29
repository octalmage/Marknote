#!/bin/bash

cd build/Marknote/osx/
zip -r MarknoteMac.zip ./*
cd ../win/
zip -r MarknoteWin.zip ./*
cd ../linux64/
zip -r MarknoteLinux.zip ./*
cd ../../../
mv build/Marknote/osx/MarknoteMac.zip ./
mv build/Marknote/win/MarknoteWin.zip ./
mv build/Marknote/linux64/MarknoteLinux.zip ./