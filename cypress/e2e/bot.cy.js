describe('template spec', () => {

  beforeEach('Login to Freva', function() {
    cy.login("bot");
  })

  it("Test unavailable bot", function() {
    cy.visit("localhost:8000/chatbot/")
  })

  it("Test starting page components", function() {
    cy.visit("localhost:8000/chatbot/")

    // BotHeader
    cy.get("[data-test='header']").should("exist").should("be-visible")
    // Heading, FormSelect (not visible), 3 Buttons
    // OnHeaderClick -> Select visible, click again (hidden)

    // botunavailable alert not existing

    // suggestions
  })

})