const helpers = require('../../support/helpers')

const { _ } = Cypress

describe('src/cy/commands/querying - shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  context('#within', () => {
    it('finds element within shadow dom with includeShadowDom option', () => {
      cy.get('#parent-of-shadow-container-0').within(() => {
        cy
        .get('p', { includeShadowDom: true })
        .should('have.length', 1)
        .should('have.text', 'Shadow Content 3')
      })
    })

    it('when within subject is shadow root, finds element without needing includeShadowDom option', () => {
      cy.get('#shadow-element-1').shadow().within(() => {
        cy
        .get('p')
        .should('have.length', 1)
        .should('have.text', 'Shadow Content 1')
      })
    })

    it('when within subject is already in shadow dom, finds element without needing includeShadowDom option', () => {
      cy.get('.shadow-8-nested-1', { includeShadowDom: true }).within(() => {
        cy
        .get('.shadow-8-nested-5')
        .should('have.text', '8')
      })
    })
  })

  context('#get', () => {
    it('finds elements within shadow roots', () => {
      cy.get('.shadow-1', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 1')
    })

    it('finds shadow elements within shadow roots', () => {
      cy.get('.shadow-5', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 5')
    })

    it('finds light elements within shadow slots', () => {
      cy.get('.in-shadow-slot', { includeShadowDom: true })
      .should('have.text', 'In Shadow Slot')
    })

    // TODO: enable once we support cross-boundary selectors nicely
    it.skip('finds elements within shadow roots with cross-boundary selector', () => {
      cy.get('#parent-of-shadow-container-0 .shadow-3', { includeShadowDom: true })
      .should('have.text', 'Shadow Content 3')
    })

    it('finds elements outside shadow roots', () => {
      cy.get('#non-shadow-element', { includeShadowDom: true })
      .should('have.text', 'Non Shadow')
    })

    it('finds elements in and out of shadow roots', () => {
      cy.get('.in-and-out', { includeShadowDom: true })
      .should('have.length', 2)
    })

    // https://github.com/cypress-io/cypress/issues/7676
    it('does not error when querySelectorAll is wrapped and snapshots are off', () => {
      cy.visit('/fixtures/shadow-dom.html?wrap-qsa=true')
      cy.get('.shadow-1', { includeShadowDom: true })
    })
  })

  context('#contains', () => {

  })

  context('#shadow', () => {
    it('returns an empty set if no shadow roots exist', () => {
      cy.get('#non-shadow-element').shadow()
      .should('not.exist')
      .then(($root) => {
        expect($root).to.be.null
      })
    })

    it('returns the shadow root of an individual element', () => {
      cy.get('#shadow-element-1').shadow()
      .then(($roots) => {
        expect($roots.length).to.eq(1)
      })
    })

    it('returns a set of shadow roots for a set of elements', () => {
      const $shadowElements = cy.$$('#shadow-element-1, #shadow-element-2')

      cy.get('#shadow-element-1, #shadow-element-2').shadow()
      .then(($roots) => {
        expect($roots.length).to.eq(2)
        expect($roots.get(0)).to.eq($shadowElements.get(0).shadowRoot)
        expect($roots.get(1)).to.eq($shadowElements.get(1).shadowRoot)
      })
    })

    it('retries until it can find a root', () => {
      cy.on('command:retry', _.after(2, () => {
        cy.$$('#non-shadow-element')[0].attachShadow({ mode: 'open' })
      }))

      cy.get('#non-shadow-element').shadow()
      .then(($roots) => {
        expect($roots.length).to.equal(1)
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('logs immediately before resolving', (done) => {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'shadow') {
            expect(log.pick('state')).to.deep.eq({
              state: 'pending',
            })

            done()
          }
        })

        cy.get('#shadow-element-1').shadow()
      })

      it('snapshots after finding element', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('has the $el', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function ($el) {
          const { lastLog } = this

          expect(lastLog.get('$el').get(0)).to.eq($el.get(0))
        })
      })

      it('#consoleProps', () => {
        cy.get('#shadow-element-1').shadow()
        .then(function ($el) {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            'Applied To': helpers.getFirstSubjectByName('get').get(0),
            Yielded: Cypress.dom.getElements($el),
            Elements: $el.length,
            Command: 'shadow',
          })
        })
      })

      it('can be turned off', () => {
        cy.get('#shadow-element-1').shadow({ log: false })
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('get')
        })
      })
    })
  })
})
