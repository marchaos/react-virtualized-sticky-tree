describe('Sticky Tree Scrolling', () => {
    beforeEach(() => {
        cy.visit('/?render=countries');
    });
    it('can scroll to the bottom and see the last node', () => {
        cy.get('.rv-sticky-tree').scrollTo(0, 10000000);
        cy.contains('Territorio Federal Delta Amacuro').should('be.visible');
    });
});
