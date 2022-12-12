import { Controller } from '@hotwired/stimulus'

import explode from '@turf/explode'
import pointsWithinPolygon from '@turf/points-within-polygon'
import { getCluster } from '@turf/clusters'

import PathFinder from 'geojson-path-finder'

import Choices from 'choices.js'

import { records as Turmas } from '../../assets/turmas.json'
import EntradasGeo from '../../assets/pontos-referencia.json'
import RotasGeo from '../../assets/rotas.json'
import SalasGeo from '../../assets/salas.json'

export default class extends Controller {
  static targets = ['origem', 'destino', 'modal', 'textoModal']
  static outlets = ['mapa']

  ChoicesI18n = {
    noResultsText: 'Nenhuma turma encontrada',
    itemSelectText: 'Clique para selecionar',
  }
  ChoicesOrigemPlaceholder = {
    label: 'selecione seu ponto de referência após a turma',
    value: '',
    selected: true,
    disabled: true
  }

  connect() {
    this.setupChoices()

    this.entradasGeo = EntradasGeo
    this.salasGeo = SalasGeo
    this.rotasGeo = RotasGeo
    this.rotasGeoPoints = explode(RotasGeo)

    this.pathFinderAndar1 = new PathFinder(getCluster(RotasGeo, { andar: 1 }))
    this.pathFinderAndar2 = new PathFinder(getCluster(RotasGeo, { andar: 2 }))
  }

  disconnect() {
    this.destinoTarget.removeEventListener('change', this.mostrarEntradasAndar)
  }

  setupChoices() {
    this.choicesOrigem = new Choices(this.origemTarget, {
      choices: [this.ChoicesOrigemPlaceholder],
      searchEnabled: false,
      allowHTML: false,
      ...this.ChoicesI18n
    })
    this.choicesOrigem.disable()

    this.choicesDestino = new Choices(this.destinoTarget, {
      choices: [{
        value: '',
        disabled: true,
        selected: true,
        label: 'selecione uma turma'
      }, ...Turmas.map(turma => ({
        value: turma.nome_sala,
        label: `<code>${turma.codigo_materia}</code>: ${turma.nome_materia} -&nbsp<em>${turma.turma}</em>`
      }))],
      searchEnabled: true,
      searchChoices: true,
      searchFloor: 3,
      searchResultLimit: Turmas.length,
      shouldSort: true,
      searchFields: ['label'],
      allowHTML: true,
      ...this.ChoicesI18n
    })
    this.choicesDestino.passedElement.element
      .addEventListener('change', this.mostrarEntradasAndar)
  }

  /**
   * Filtra os pontos de referência pelo andar da sala selecionada
   * @param {Event} event
   */
  mostrarEntradasAndar = (event) => {
    const sala = /\d{4}/.exec(event.detail.value)?.[0]

    this.salaSelecionada = sala && getCluster(this.salasGeo, { sala }).features[0]

    if (!this.salaSelecionada) return this.mostrarModalSala404(event.detail.value)

    this.andarSelecionado = this.salaSelecionada.properties.andar
    this.mapaOutlet.mostrarSala(this.salaSelecionada)
    const entradasAndar = getCluster(this.entradasGeo, { andar: this.andarSelecionado }).features
    this.choicesOrigem.setChoices(entradasAndar.map(entrada => ({
      value: entrada.properties.pkuid,
      label: entrada.properties.nome
    })), 'value', 'label', true)
    this.choicesOrigem.enable()
    this.origemTarget.focus()
  }

  mostrarModalSala404 = (sala) => {
    this.textoModalTarget.innerText = sala
    this.modalTarget.showModal()
    this.resetarChoices()
  }

  clickModal(event) {
    const bbox = event.target.getBoundingClientRect();
    if (bbox.top <= event.clientY && event.clientY <= bbox.top + bbox.height &&
      rect.left <= event.clientX && event.clientX <= bbox.left + bbox.width)
      return

    event.preventDefault()
    this.modalTarget.close()
  }

  resetarChoices = () => {
    this.choicesDestino.setChoiceByValue('')
    this.choicesOrigem.setChoices([this.ChoicesOrigemPlaceholder], 'value', 'label', true)
  }

  /**
   * Busca um ponto nas rotas que esteja dentro da sala
   * @param {Feature<Polygon>} salaGeo
   * @returns {Feature<Point> || undefined}
   */
  buscarRedeSala = (salaGeo) => {
    const pontosRotasAndar = getCluster(this.rotasGeoPoints, { andar: this.andarSelecionado })
    const entradaRotaSala = pointsWithinPolygon(pontosRotasAndar, salaGeo)
    return entradaRotaSala.features[0]
  }

  /**
   * Calcula a rota entre o ponto de entrada e a saída da sala
   * @param {SubmitEvent} event
   */
  calcularRota = (event) => {
    event.preventDefault()
    const pkuidEntrada = this.choicesOrigem.getValue(true)
    const pontoEntrada = this.entradasGeo.features.find(entrada => entrada.properties.pkuid === pkuidEntrada)

    const pontoSaida = this.buscarRedeSala(this.salaSelecionada)
    if (!pontoSaida) return this.mostrarModalSala404(this.choicesOrigem.getValue(true))

    let rota
    if (pontoSaida.properties.andar === 1) {
      rota = this.pathFinderAndar1.findPath(pontoEntrada, pontoSaida)
    } else {
      rota = this.pathFinderAndar2.findPath(pontoEntrada, pontoSaida)
    }
    this.mapaOutlet.mostrarRota(rota, this.salaSelecionada)
  }

  reset = (event) => {
    event.preventDefault()
    this.resetarChoices()
    this.mapaOutlet.reset()
  }
}
