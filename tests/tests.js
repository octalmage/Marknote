var assert = require('assert'),
  SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
  test = require('selenium-webdriver/testing'),
  webdriver = require('selenium-webdriver');

var server = new SeleniumServer("../selenium-server-standalone-2.43.0.jar", {
  port: 4444
});

server.start();

var driver = new webdriver.Builder().
usingServer(server.address()).
withCapabilities(webdriver.Capabilities.chrome()).
build();


var notes = Array();
var notes2 = Array();

test.describe('Marknote', function()
{
  this.timeout(50000);
  test.describe('Notes', function()
  {
  test.it('Has notes.', function()
  {
    driver.executeScript("return notes").then(function(arr)
    {
      notes = arr;
      assert.notEqual(notes, "");
    });


  });

  test.it('Can add note.', function()
  {

    driver.wait(function() 
    {
     return driver.isElementPresent(webdriver.By.id('newNote'));
    }, 5000);
    driver.findElement(webdriver.By.id('newNote')).click();

    driver.executeScript('return notes').then(function(arr)
    {
      notes2 = arr;
      assert.notEqual(notes2.length, notes.length);
    });


  });

  test.it('Can open editor.', function()
  {

    driver.findElement(webdriver.By.id('display')).click();
    driver.findElement(webdriver.By.id('display')).click();
    driver.findElement(webdriver.By.id('display')).click();

    driver.executeScript('return displayShowing()').then(function(test)
    {
      assert.equal(test, false);
    });
  });

  test.it('Can edit note.', function()
  {
    var pretext;
    driver.executeScript('return editor.getValue();').then(function(pre)
    {
      pretext=pre;
    });
    driver.executeScript("editor.insert('test');");
    driver.executeScript('return editor.getValue();').then(function(post)
    {
      assert.notEqual(pretext, post);
    });
  });


  test.it('Can save note.', function()
  {
    driver.findElement(webdriver.By.id('note')).click();
    driver.findElement(webdriver.By.id('note')).click();
    driver.findElement(webdriver.By.id('note')).click();

    driver.wait(function() 
    {
     return driver.isElementPresent(webdriver.By.id('display'));
    }, 1000); 

    driver.executeScript('return displayShowing()').then(function(test)
    {
      assert.equal(test, true);
    });

  });

  test.it('Can delete note.', function()
  {
    driver.executeScript('$("#actions").css("display", "block");').then(function()
    {
      driver.findElement(webdriver.By.xpath('//paper-icon-button[@icon="close"]')).click();
    });

    driver.executeScript("return notes").then(function(arr)
    {
      notes = arr;
      assert.notEqual(notes.length, notes2.length);
    });

  });

});

});
