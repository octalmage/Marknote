var assert = require('assert'),
  test = require('selenium-webdriver/testing'),
  webdriver = require('selenium-webdriver');

var driver = new webdriver.Builder().
withCapabilities(webdriver.Capabilities.chrome()).
build();


var notes = Array();
var notes2 = Array();

test.describe('Marknote', function()
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

    driver.findElement(webdriver.By.id('newNote')).click();

    driver.executeScript('return notes').then(function(arr)
    {
      notes2 = arr;
      assert.equal(notes2.length, notes.length + 1);
    });


  });
});