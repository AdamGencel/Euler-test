import { test, expect } from "../../fixtures";
import { EulerGovernancePage } from "../pages/governance-page"




test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Successful self delegation", async ({ page }) => {
  const eulerGovPage = new EulerGovernancePage(page);
  await eulerGovPage.connectWallet();
  await eulerGovPage.goToDelegation('0x3E14Bb40276346c49aabF01301fC93C1b7c54a70');

  const votingPower = await eulerGovPage.getVotingPower();
  await eulerGovPage.delegateToSelf();

  const NewVotingPower = await eulerGovPage.getVotingPower();
  expect(NewVotingPower).toBeGreaterThan(votingPower);
});

/*

Not sure if this is a bug but I was not able to find a way to undelegate,
Below is a sample code that with small changes should execute undelegation if it existed

test("Check un-delegation", async ({ page }) => {
  const eulerGovPage = new EulerGovernancePage(page);
  await eulerGovPage.connectWallet();
  await eulerGovPage.goToDelegation('0x3E14Bb40276346c49aabF01301fC93C1b7c54a70');

  const votingPower = await eulerGovPage.getVotingPower();
  await eulerGovPage.delegateToSelf();

  const NewVotingPower = await eulerGovPage.getVotingPower();
  expect(NewVotingPower).toBeGreaterThan(votingPower);
});



This is definetly a bug, there are no error messages and users can perform a "delegation" without any tokens
I will attach a video of this. But again below find a sample code that with small changes should execute

test("Check error messages when trying to delegate without EUL token", async ({ page }) => {
  const eulerGovPage = new EulerGovernancePage(page);
  const commons = new CommonSteps(page);
  await metamask.createAccount("empty account");
  await eulerGovPage.connectWallet();
  await eulerGovPage.goToDelegation('0x3E14Bb40276346c49aabF01301fC93C1b7c54a70');
  await page.click(eulerGovPage.delegateToSelfButton);
  await commons.verifyErrorMessage('errorFieldSelector', 'You dont have any EUL')
});*/


// the cleanup is very "crude", since there is no option to undelegate
// I went with aproach to delegate to another user which un-self delegate 
// This is definetly something I would spend more time on and make it work for all future tests

test.afterEach(async ({ page }) => {
  console.log('Cleaning UP!');
  const eulerGovPage = new EulerGovernancePage(page);
  await page.goto("/delegates/?", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await eulerGovPage.delegateToFirstAvailable();
});


