#!/bin/bash

cd build/Marknote/osx64/
zip -r MarknoteMac.zip ./*
cd ../win32/
zip -r MarknoteWin.zip ./*
cd ../linux32/
zip -r MarknoteLinux.zip ./*
cd ../../../
mv build/Marknote/osx64/MarknoteMac.zip ./
mv build/Marknote/win32/MarknoteWin.zip ./
mv build/Marknote/linux32/MarknoteLinux.zip ./